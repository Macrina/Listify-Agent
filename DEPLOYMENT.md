# Deployment Guide for Listify Agent

## Render Deployment

This guide will help you deploy your Listify Agent application to Render.

### Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Repository**: Your code should be pushed to GitHub
3. **Environment Variables**: You'll need your API keys

### Required Environment Variables

#### Backend Service
- `OPENAI_API_KEY`: Your OpenAI API key
- `AGENTDB_API_KEY`: Your AgentDB API key  
- `AGENTDB_MCP_URL`: https://mcp.agentdb.dev/LW-aEoVKYL
- `AGENTDB_DB_NAME`: listify-agent
- `NODE_ENV`: production
- `PORT`: 3001

#### Frontend Service
- `VITE_API_URL`: https://your-backend-service.onrender.com/api

### Deployment Steps

#### 1. Deploy Backend Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `listify-agent-backend`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm install`
   - **Start Command**: `cd backend && npm start`
   - **Plan**: Starter (Free)

5. Set Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `3001`
   - `OPENAI_API_KEY` = `your_openai_key`
   - `AGENTDB_API_KEY` = `your_agentdb_key`
   - `AGENTDB_MCP_URL` = `https://mcp.agentdb.dev/LW-aEoVKYL`
   - `AGENTDB_DB_NAME` = `listify-agent`

6. Click "Create Web Service"

#### 2. Deploy Frontend Service

1. In Render Dashboard, click "New +" → "Static Site"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `listify-agent-frontend`
   - **Build Command**: `cd frontend && npm install && npm run build`
   - **Publish Directory**: `frontend/dist`
   - **Plan**: Starter (Free)

4. Set Environment Variables:
   - `VITE_API_URL` = `https://your-backend-service.onrender.com/api`

5. Click "Create Static Site"

### Post-Deployment Configuration

1. **Update Frontend Environment**: After backend deployment, update the frontend's `VITE_API_URL` to point to your actual backend URL
2. **Test the Application**: Visit your frontend URL to test the deployment
3. **Monitor Logs**: Check Render logs for any issues

### Troubleshooting

#### Common Issues

1. **Build Failures**: Check that all dependencies are in package.json
2. **Environment Variables**: Ensure all required variables are set
3. **CORS Issues**: Backend should handle CORS for the frontend domain
4. **Database Connection**: Verify AgentDB credentials are correct

#### Health Checks

- Backend: `https://your-backend.onrender.com/api/health`
- Frontend: Your static site URL

### Cost Considerations

- **Free Tier**: Both services can run on Render's free tier
- **Limitations**: Free tier has sleep mode and limited resources
- **Upgrade**: Consider paid plans for production use

### Security Notes

- Never commit API keys to your repository
- Use Render's environment variable system
- Consider using Render's secrets management for sensitive data

### Monitoring

- Monitor your services in the Render dashboard
- Set up alerts for service failures
- Check logs regularly for errors

### Custom Domain (Optional)

1. In Render dashboard, go to your service
2. Click "Settings" → "Custom Domains"
3. Add your domain and configure DNS
4. Update environment variables if needed
