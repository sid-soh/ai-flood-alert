# Lambda Functions for AI Flood Alert System

This directory contains the AWS Lambda functions for the backend services.

## Functions

### 1. evacuationRoute
- **Purpose**: AI-powered evacuation route optimization using Amazon Bedrock
- **Dependencies**: @aws-sdk/client-bedrock-runtime
- **API Endpoint**: `/optimize-route`

### 2. floodAnalysis  
- **Purpose**: Flood risk analysis and evacuation point finder
- **Dependencies**: mysql2
- **API Endpoint**: `/flood-analysis`

### 3. aiAssistant
- **Purpose**: AI-powered emergency assistance chatbot
- **Dependencies**: @aws-sdk/client-bedrock-runtime, mysql2
- **API Endpoint**: `/chat`

## Local Development

### Install Dependencies
```bash
# For each function directory:
cd lambda/evacuationRoute
npm install

cd ../floodAnalysis  
npm install

cd ../aiAssistant
npm install
```

### Environment Variables
Set these in AWS Lambda console:
- `DB_HOST`: RDS MySQL endpoint
- `DB_USER`: Database username
- `DB_PASSWORD`: Database password
- `DB_NAME`: Database name (flood_alert_db)
- `DB_PORT`: Database port (3306)

### Deploy to AWS
```bash
# Create deployment package for each function
cd lambda/evacuationRoute
zip -r evacuationRoute.zip .

# Upload to AWS Lambda
aws lambda update-function-code --function-name evacuationRoute --zip-file fileb://evacuationRoute.zip
```

## API Gateway Integration

Each function should be connected to API Gateway with:
- CORS enabled
- POST method
- Lambda proxy integration

## IAM Permissions Required

- **evacuationRoute**: Bedrock InvokeModel permissions
- **floodAnalysis**: VPC access for RDS
- **aiAssistant**: Both Bedrock and VPC/RDS permissions