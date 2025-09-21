import boto3
import zipfile
import os
from dotenv import load_dotenv

load_dotenv('.env')

def deploy_lambda():
    """Deploy Lambda function manually"""
    
    # Create deployment package
    with zipfile.ZipFile('lambda-deployment.zip', 'w') as zip_file:
        zip_file.write('lambda/api_handler.py', 'api_handler.py')
        zip_file.write('lambda/rds_connector.py', 'rds_connector.py')
    
    lambda_client = boto3.client(
        'lambda',
        region_name='ap-southeast-5',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    try:
        # Create Lambda function
        with open('lambda-deployment.zip', 'rb') as zip_file:
            response = lambda_client.create_function(
                FunctionName='flood-alert-api',
                Runtime='python3.9',
                Role=f"arn:aws:iam::{os.getenv('AWS_ACCOUNT_ID')}:role/rds-execution",
                Handler='api_handler.lambda_handler',
                Code={'ZipFile': zip_file.read()},
                Environment={
                    'Variables': {
                        'RDS_ENDPOINT': os.getenv('RDS_ENDPOINT'),
                        'RDS_USERNAME': os.getenv('RDS_USERNAME'),
                        'RDS_PASSWORD': os.getenv('RDS_PASSWORD')
                    }
                }
            )
        
        print(f"✓ Lambda function created: {response['FunctionArn']}")
        
    except Exception as e:
        if 'already exists' in str(e):
            print("Lambda function already exists")
        else:
            print(f"Error: {e}")

if __name__ == '__main__':
    deploy_lambda()