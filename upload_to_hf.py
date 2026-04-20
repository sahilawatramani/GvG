from huggingface_hub import HfApi
import os

# ==========================================================
# GvG Defense — Hugging Face Uploader
# ==========================================================
# This script will upload your backend files and folders 
# to your Hugging Face Space while preserving the structure.
# ==========================================================

def upload():
    api = HfApi()

    # 1. Get your Repo ID
    # Usually: "username/space-name"
    repo_id = input("Enter your Hugging Face Repo ID (e.g., 'your-username/gvg-backend'): ").strip()
    
    if not repo_id:
        print("Error: Repo ID is required.")
        return

    print(f"\n🚀 Preparing to upload to {repo_id}...")
    print("--------------------------------------------------")

    try:
        # We upload the current directory to the 'main' branch of the Space
        api.upload_folder(
            folder_path=".",
            repo_id=repo_id,
            repo_type="space",
            # We ignore the frontend and environment files to keep the Space small 
            # and avoid build errors on Hugging Face.
            ignore_patterns=[
                "frontend/**", 
                "node_modules/**",
                ".git/**", 
                "venv/**",
                ".env",
                "__pycache__/**",
                "*.pyc",
                ".ipynb_checkpoints/**"
            ]
        )
        print("--------------------------------------------------")
        print("✅ SUCCESS! Your files have been uploaded.")
        print("Hugging Face will now start building your Docker container.")
        print("Check your Space's 'Logs' tab to see the progress.")
        
    except Exception as e:
        print(f"\n❌ UPLOAD FAILED: {str(e)}")
        print("\nMake sure:")
        print("1. You have 'huggingface-hub' installed: pip install huggingface-hub")
        print("2. You are logged in: huggingface-cli login")
        print("3. The Repo ID is correct and you have write access.")

if __name__ == "__main__":
    upload()
