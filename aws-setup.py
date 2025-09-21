import boto3
import json
import os
from dotenv import load_dotenv

load_dotenv()

def setup_aws_resources():
    """Set up AWS resources for flood alert system"""
    
    # Initialize AWS clients
    lambda_client = boto3.client(
        'lambda',
        region_name='ap-southeast-5',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    apigateway_client = boto3.client(
        'apigateway',
        region_name='ap-southeast-5',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    print("🚀 Setting up AWS resources for Flood Alert System...")
    
    # Create Lambda functions
    lambda_functions = [
        {
            'name': 'floodAnalysis',
            'description': 'AI-powered flood risk analysis using Bedrock',
            'handler': 'index.handler',
            'runtime': 'nodejs18.x'
        },
        {
            'name': 'floodData',
            'description': 'Flood data retrieval from RDS database',
            'handler': 'index.handler',
            'runtime': 'nodejs18.x'
        },
        {
            'name': 'evacuationRoute',
            'description': 'Evacuation route optimization',
            'handler': 'index.handler',
            'runtime': 'nodejs18.x'
        }
    ]
    
    for func in lambda_functions:
        try:
            response = lambda_client.create_function(
                FunctionName=func['name'],
                Runtime=func['runtime'],
                Role=f"arn:aws:iam::{os.getenv('AWS_ACCOUNT_ID')}:role/lambda-execution-role",
                Handler=func['handler'],
                Code={'ZipFile': b'exports.handler = async (event) => ({ statusCode: 200, body: JSON.stringify({message: "Function created"}) });'},
                Description=func['description'],
                Environment={
                    'Variables': {
                        'AWS_REGION': 'ap-southeast-5',
                        'DB_HOST': os.getenv('RDS_ENDPOINT', ''),
                        'DB_USER': os.getenv('RDS_USERNAME', ''),
                        'DB_PASSWORD': os.getenv('RDS_PASSWORD', ''),
                        'DB_NAME': os.getenv('RDS_DATABASE', '')
                    }
                }
            )
            print(f"✅ Created Lambda function: {func['name']}")
        except Exception as e:
            if 'already exists' in str(e):
                print(f"⚠️ Lambda function {func['name']} already exists")
            else:
                print(f"❌ Error creating {func['name']}: {e}")
    
    # Create API Gateway
    try:
        api_response = apigateway_client.create_rest_api(
            name='flood-alert-api',
            description='API for Flood Alert System',
            endpointConfiguration={'types': ['REGIONAL']}
        )
        api_id = api_response['id']
        print(f"✅ Created API Gateway: {api_id}")
        
        # Get root resource
        resources = apigateway_client.get_resources(restApiId=api_id)
        root_id = resources['items'][0]['id']
        
        # Create resources and methods
        endpoints = [
            {'path': 'flood-analysis', 'lambda': 'floodAnalysis'},
            {'path': 'flood-status', 'lambda': 'floodData'},
            {'path': 'evacuation-route', 'lambda': 'evacuationRoute'}
        ]
        
        for endpoint in endpoints:
            # Create resource
            resource = apigateway_client.create_resource(
                restApiId=api_id,
                parentId=root_id,
                pathPart=endpoint['path']
            )
            
            # Create POST method
            apigateway_client.put_method(
                restApiId=api_id,
                resourceId=resource['id'],
                httpMethod='POST',
                authorizationType='NONE'
            )
            
            # Set up integration
            apigateway_client.put_integration(
                restApiId=api_id,
                resourceId=resource['id'],
                httpMethod='POST',
                type='AWS_PROXY',
                integrationHttpMethod='POST',
                uri=f"arn:aws:apigateway:ap-southeast-5:lambda:path/2015-03-31/functions/arn:aws:lambda:ap-southeast-5:{os.getenv('AWS_ACCOUNT_ID')}:function:{endpoint['lambda']}/invocations"
            )
            
            print(f"✅ Created endpoint: /{endpoint['path']}")
        
        # Deploy API
        deployment = apigateway_client.create_deployment(
            restApiId=api_id,
            stageName='prod'
        )
        
        api_url = f"https://{api_id}.execute-api.ap-southeast-5.amazonaws.com/prod"
        print(f"🌐 API deployed at: {api_url}")
        
    except Exception as e:
        print(f"❌ Error setting up API Gateway: {e}")
    
    print("\n✅ AWS setup completed!")
    print("Next steps:")
    print("1. Upload Lambda function code")
    print("2. Configure RDS database")
    print("3. Set up proper IAM roles")
    print("4. Test API endpoints")

if __name__ == '__main__':
    setup_aws_resources()