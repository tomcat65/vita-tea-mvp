# Firebase Continuous Deployment Setup

## GitHub Actions Configuration

This project uses GitHub Actions to automatically deploy to Firebase Hosting when changes are pushed to the main branch.

### Required GitHub Secrets

You need to set up the following secrets in your GitHub repository:

1. **FIREBASE_SERVICE_ACCOUNT**
   - Generate this by running:
     ```bash
     firebase init hosting:github
     ```
   - Or manually create a service account:
     ```bash
     # In Google Cloud Console for your project
     gcloud iam service-accounts create github-action-deploy \
       --display-name "GitHub Action Deploy"
     
     gcloud projects add-iam-policy-binding vida-tea \
       --member=serviceAccount:github-action-deploy@vida-tea.iam.gserviceaccount.com \
       --role=roles/firebasehosting.admin
     
     gcloud iam service-accounts keys create key.json \
       --iam-account github-action-deploy@vida-tea.iam.gserviceaccount.com
     ```
   - Copy the contents of `key.json` and add it as a secret named `FIREBASE_SERVICE_ACCOUNT`

2. **FIREBASE_PROJECT_ID**
   - Set this to: `vida-tea`

### How to Add GitHub Secrets

1. Go to your GitHub repository
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add each secret with its value

### Deployment Workflows

- **Main branch deployment**: Automatically deploys to production when pushing to `main`
- **Pull request previews**: Creates preview deployments for pull requests

### Manual Deployment

To deploy manually from your local machine:

```bash
# Deploy to production
firebase deploy --only hosting

# Deploy to a preview channel
firebase hosting:channel:deploy preview-name
```

### Troubleshooting

If deployments fail:
1. Check that all secrets are properly set
2. Ensure Firebase hosting is initialized: `firebase init hosting`
3. Verify the project ID matches: `vida-tea`
4. Check GitHub Actions logs for specific errors