# Comprehensive Guide to GCP Setup & Deployment

This guide provides a complete, step-by-step process for setting up a new Google Cloud Platform (GCP) environment and deploying this application.

The process is divided into two parts:
- **Part 1: One-Time Manual Setup.** You will perform these steps once to create and configure your GCP resources. This part requires manual intervention to run commands and record the outputs.
- **Part 2: Automated Deployment.** Once the initial setup is complete, you can use a simple, automated script for all future deployments.

---

## Part 1: One-Time Manual Setup

> **Note for users with existing projects:** If you have already created a GCP project, you can skip the `gcloud projects create` command. However, you must still perform the other configuration steps in this section, such as setting the project, getting the project number, and enabling APIs. Make sure you have your Project ID available.

**Objective:** To create the necessary GCP project, enable APIs, create a repository, and configure service accounts.

**IMPORTANT:** As you complete these steps, have a text editor open. You will need to **copy and paste** the output values (like your new Project ID and service account emails) to use in Part 2.

### 1. Local Prerequisites & Initial Login

- Ensure Node.js, npm, and the [Google Cloud SDK](https://cloud.google.com/sdk/docs/install) (`gcloud` CLI) are installed.

#### Authentication Setup

- **Check current authentication status:**
  ```bash
  gcloud auth list
  ```
  This shows which accounts are authenticated and which one is currently active.

- **If you need to switch accounts or are authenticated with a service account from another project:**
  ```bash
  # Log out from current account
  gcloud auth revoke
  
  # Or log out from a specific account
  gcloud auth revoke [ACCOUNT_EMAIL]
  ```

- **Authenticate with your personal Google account:**
  ```bash
  gcloud auth login
  ```
  > **Note:** Always use your personal Google account (not a service account) for the setup process. Service accounts from other projects may cause permission issues when creating or configuring new projects.

### 2. Create and Configure Your GCP Project

- **Create a new GCP Project.** Replace `your-unique-project-id` with a unique name.
  ```bash
  gcloud projects create your-unique-project-id
  ```
  > **ACTION:** A `project_id` will be returned. **Save this value.**

- **Set the `gcloud` CLI to use your new project.**
  ```bash
  gcloud config set project [YOUR_SAVED_PROJECT_ID]
  ```

- **Find your Project Number.**
  ```bash
  gcloud projects describe [YOUR_SAVED_PROJECT_ID] --format="value(projectNumber)"
  ```
  > **ACTION:** **Save the Project Number** that is returned.

- **Enable the required GCP APIs.**
  ```bash
  gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com cloudresourcemanager.googleapis.com iam.googleapis.com serviceusage.googleapis.com
  ```

### 3. Create the Artifact Registry Repository

- Create a Docker repository to store your application images.
  ```bash
  gcloud artifacts repositories create [CHOOSE_A_REPOSITORY_NAME] \
      --repository-format=docker \
      --location=[CHOOSE_A_GCP_REGION] \
      --description="Application Docker images"
  ```
  > **ACTION:** **Save the Repository Name and Region** you chose.

### 4. Create Service Accounts and Keys

- **Create the "Deployer" Service Account.** This account will perform the build and deployment.
  ```bash
  gcloud iam service-accounts create [CHOOSE_A_DEPLOYER_SA_NAME] \
      --display-name="App Deployment Service Account"
  ```
  > **ACTION:** **Save the Deployer SA Name.** An email address for this account will be returned. **Save the full email address.**

- **Grant the "Deployer" Service Account the necessary roles.**
  ```bash
  gcloud projects add-iam-policy-binding [YOUR_SAVED_PROJECT_ID] --member="serviceAccount:[YOUR_SAVED_DEPLOYER_SA_EMAIL]" --role="roles/cloudbuild.builds.editor"
gcloud projects add-iam-policy-binding [YOUR_SAVED_PROJECT_ID] --member="serviceAccount:[YOUR_SAVED_DEPLOYER_SA_EMAIL]" --role="roles/run.admin"
gcloud projects add-iam-policy-binding [YOUR_SAVED_PROJECT_ID] --member="serviceAccount:[YOUR_SAVED_DEPLOYER_SA_EMAIL]" --role="roles/artifactregistry.writer"
gcloud projects add-iam-policy-binding [YOUR_SAVED_PROJECT_ID] --member="serviceAccount:[YOUR_SAVED_DEPLOYER_SA_EMAIL]" --role="roles/iam.serviceAccountUser"
gcloud projects add-iam-policy-binding [YOUR_SAVED_PROJECT_ID] --member="serviceAccount:[YOUR_SAVED_DEPLOYER_SA_EMAIL]" --role="roles/serviceusage.serviceUsageConsumer"
gcloud projects add-iam-policy-binding [YOUR_SAVED_PROJECT_ID] --member="serviceAccount:[YOUR_SAVED_DEPLOYER_SA_EMAIL]" --role="roles/storage.admin"
  ```

- **Create and download a key file for the "Deployer" Service Account.**
  ```bash
  gcloud iam service-accounts keys create [CHOOSE_A_KEY_FILENAME].json \
      --iam-account=[YOUR_SAVED_DEPLOYER_SA_EMAIL]
  ```
  > **ACTION:** This creates a `.json` file in your current directory. **Save the filename** you chose. This file is sensitive; do not commit it to git.

  > **Note:** A `deployer-key-example.json` file is included in this project as a template reference. It shows the structure of what your actual service account key file should look like, but contains only placeholder values for security. Your real key file (created above) will have the same structure but with actual credentials. Never commit your real key file to version control.

- **Identify the "Runtime" Service Account.** This is the default Compute Engine service account. Its email is constructed using your Project Number.
  > **ACTION:** The email address is `[YOUR_SAVED_PROJECT_NUMBER]-compute@developer.gserviceaccount.com`. **Save this email address.**

- **Grant the "Runtime" Service Account the necessary roles.**
  ```bash
  gcloud projects add-iam-policy-binding [YOUR_SAVED_PROJECT_ID] --member="serviceAccount:[YOUR_SAVED_RUNTIME_SA_EMAIL]" --role="roles/artifactregistry.reader"
gcloud projects add-iam-policy-binding [YOUR_SAVED_PROJECT_ID] --member="serviceAccount:[YOUR_SAVED_RUNTIME_SA_EMAIL]" --role="roles/storage.objectViewer"
  ```

**You have now completed the one-time setup. You should have all the required values saved.**

---

## Part 2: Automated Deployment

**Objective:** To configure the local project environment and run a simple script for all deployments.

### 1. Configure Your Local Environment

- **Create your personal environment file** by copying the provided example:
  ```bash
  cp .env.example .env
  ```

- **Edit the `.env` file.** Open the newly created `.env` file in a text editor.
- **Fill in the values** that you saved from Part 1. The file contains all the variables the deployment script needs.

  Example of a filled-out `.env` file:
  ```
  # GCP Configuration
  export YOUR_PROJECT_ID="your-gcp-project-id"
  export YOUR_PROJECT_NUMBER="123456789012"
  export YOUR_REGION="your-gcp-region"
  export YOUR_REPOSITORY_NAME="your-artifact-repo-name"
  export YOUR_IMAGE_NAME="your-application-image-name"
  export YOUR_SERVICE_NAME="your-cloud-run-service-name"

  # Service Account Details
  export YOUR_DEPLOYER_SA_EMAIL="deployer-sa-name@your-gcp-project-id.iam.gserviceaccount.com"
  export YOUR_DEPLOYER_KEY_FILE_NAME="your-sa-key-filename.json"
  export YOUR_RUNTIME_SA_EMAIL="123456789012-compute@developer.gserviceaccount.com"
  ```

### 2. Run the Automated Deployment Script

- Once your `.env` file is correctly filled out, you can deploy the application at any time by running:
  ```bash
  npm run deploy
  ```

This script will build your application, authenticate using your key file, push the Docker image to your repository, and deploy it to Cloud Run, confirming with you before it starts.
