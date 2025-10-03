#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Function to print in color
print_green() {
  echo -e "\033[0;32m$1\033[0m"
}

# Check if .env file exists and source it
if [ -f ./.env ]; then
  print_green "Sourcing environment variables from .env file..."
  source ./.env
else
  echo -e "\033[0;31mError: .env file not found. Please create one from .env.example and fill in your details.\033[0m"
  exit 1
fi

# Confirmation prompt logic
if [ "$1" == "--force" ]; then
  echo "--force flag detected, skipping confirmation prompt."
  REPLY="y"
else
  read -p "Are you sure you want to deploy to project '$YOUR_PROJECT_ID'? (y/n) " -n 1 -r
  echo # Move to a new line
fi

if [[ $REPLY =~ ^[Yy]$ ]]
then
  print_green "\nStep 1/4: Building local application files..."
  npm run build

  print_green "\nStep 2/4: Submitting build to GCP..."
  # Start the build asynchronously and request the output in JSON format.
  BUILD_INFO_JSON=$(gcloud builds submit --tag $YOUR_REGION-docker.pkg.dev/$YOUR_PROJECT_ID/$YOUR_REPOSITORY_NAME/$YOUR_IMAGE_NAME:latest . --project=$YOUR_PROJECT_ID --async --format=json)

  # Extract the build ID from the JSON output.
  BUILD_ID=$(echo "$BUILD_INFO_JSON" | grep '"id":' | awk -F '"' '{print $4}')

  if [ -z "$BUILD_ID" ]; then
    echo -e "\033[0;31mError: Failed to parse Build ID from gcloud command. Raw output:\n$BUILD_INFO_JSON\033[0m"
    exit 1
  fi

  BUILD_LOG_URL=$(echo "$BUILD_INFO_JSON" | grep '"logUrl":' | awk -F '"' '{print $4}')
  print_green "Build started with ID: $BUILD_ID."
  print_green "You can view the live logs here: $BUILD_LOG_URL"

  print_green "\nStep 3/4: Polling for build completion..."
  # Poll for build completion
  while true; do
    STATUS=$(gcloud builds describe $BUILD_ID --project=$YOUR_PROJECT_ID --format='value(status)')
    if [ "$STATUS" == "SUCCESS" ]; then
      print_green "Build successful."
      break
    elif [ "$STATUS" == "FAILURE" ] || [ "$STATUS" == "INTERNAL_ERROR" ] || [ "$STATUS" == "CANCELLED" ]; then
      echo -e "\033[0;31mBuild failed with status: $STATUS\033[0m"
      exit 1
    fi
    echo "Build status is: $STATUS. Waiting 10 seconds..."
    sleep 10
  done

  print_green "\nStep 4/4: Deploying to Cloud Run..."
  gcloud run deploy $YOUR_SERVICE_NAME \
    --image=$YOUR_REGION-docker.pkg.dev/$YOUR_PROJECT_ID/$YOUR_REPOSITORY_NAME/$YOUR_IMAGE_NAME:latest \
    --region=$YOUR_REGION \
    --platform=managed \
    --service-account=$YOUR_RUNTIME_SA_EMAIL \
    --allow-unauthenticated \
    --project=$YOUR_PROJECT_ID \
    --quiet

  print_green "\nDeployment complete!"
else
  echo "Deployment cancelled."
fi