import boto3
import zipfile
import os
import json
from dotenv import load_dotenv

load_dotenv()

def update_lambda_function(function_name, zip_path, handler='index.handler'):
    """Update Lambda function with new code"""
    
    lambda_client = boto3.client(
        'lambda',
        region_name='ap-southeast-5',
        aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY')
    )
    
    try:
        # Read the zip file
        with open(zip_path, 'rb') as zip_file:
            zip_content = zip_file.read()
        
        # Update function code
        response = lambda_client.update_function_code(
            FunctionName=function_name,
            ZipFile=zip_content
        )
        
        print(f"✅ Updated Lambda function: {function_name}")
        print(f"   Version: {response['Version']}")
        print(f"   Last Modified: {response['LastModified']}")
        
        # Update environment variables if needed
        env_vars = {
            'AWS_REGION': 'ap-southeast-5',
            'DB_HOST': os.getenv('RDS_ENDPOINT', ''),
            'DB_USER': os.getenv('RDS_USERNAME', ''),
            'DB_PASSWORD': os.getenv('RDS_PASSWORD', ''),
            'DB_NAME': os.getenv('RDS_DATABASE', 'flood_alert_system')
        }
        
        lambda_client.update_function_configuration(
            FunctionName=function_name,
            Environment={'Variables': env_vars}
        )
        
        print(f"✅ Updated environment variables for {function_name}")
        
    except Exception as e:
        print(f"❌ Error updating {function_name}: {e}")

def create_deployment_package(source_dir, output_path):
    """Create deployment package for Lambda"""
    
    print(f"📦 Creating deployment package: {output_path}")
    
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        for root, dirs, files in os.walk(source_dir):
            for file in files:
                if file.endswith(('.js', '.json')):
                    file_path = os.path.join(root, file)
                    arc_name = os.path.relpath(file_path, source_dir)
                    zip_file.write(file_path, arc_name)
                    print(f"   Added: {arc_name}")
    
    print(f"✅ Package created: {output_path}")

def deploy_all_functions():
    """Deploy all Lambda functions"""
    
    functions = [
        {
            'name': 'floodAnalysis',
            'source': 'lambda/floodAnalysis',
            'zip': 'floodAnalysis.zip'
        },
        {
            'name': 'floodData', 
            'source': 'lambda/floodData',
            'zip': 'floodData.zip'
        },
        {
            'name': 'evacuationRoute',
            'source': 'lambda/evacuationRoute', 
            'zip': 'evacuationRoute.zip'
        }
    ]
    
    print("🚀 Deploying all Lambda functions...\n")
    
    for func in functions:
        if os.path.exists(func['source']):
            print(f"📦 Processing {func['name']}...")
            create_deployment_package(func['source'], func['zip'])
            update_lambda_function(func['name'], func['zip'])
            
            # Clean up zip file
            if os.path.exists(func['zip']):
                os.remove(func['zip'])
            
            print("─" * 50)
        else:
            print(f"⚠️ Source directory not found: {func['source']}")
    
    print("✅ Deployment completed!")

if __name__ == '__main__':
    import sys
    
    if len(sys.argv) > 1:
        if sys.argv[1] == 'all':
            deploy_all_functions()
        else:
            function_name = sys.argv[1]
            zip_path = sys.argv[2] if len(sys.argv) > 2 else f"{function_name}.zip"
            update_lambda_function(function_name, zip_path)
    else:
        print("Usage:")
        print("  python update-lambda.py all                    # Deploy all functions")
        print("  python update-lambda.py <function> <zip>       # Deploy specific function")