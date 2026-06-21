from optimum.onnxruntime import ORTModelForSequenceClassification
from transformers import AutoTokenizer
import os

models_to_convert = {
    "DistilBERT_Indo": "distilbert_onnx",
    "RoBERTa_Indo": "roberta_onnx",
    "XLM_RoBERTa_Multi": "xlm_roberta_onnx"
}

print("Starting ONNX Python Conversion Pipeline...")

for source_folder, target_folder in models_to_convert.items():
    if os.path.exists(f"./{source_folder}"):
        print(f"\nLoading and converting {source_folder}...")
        
        try:
            # Using the default Fast Tokenizer since tokenizer.json is the only file present
            tokenizer = AutoTokenizer.from_pretrained(f"./{source_folder}")
            model = ORTModelForSequenceClassification.from_pretrained(f"./{source_folder}", export=True)
            
            # Save them into the new lightweight folder
            tokenizer.save_pretrained(f"./{target_folder}")
            model.save_pretrained(f"./{target_folder}")
            
            print(f"{source_folder} successfully converted and saved to {target_folder}!")
        except Exception as e:
            print(f"Failed to convert {source_folder}. Error: {e}")
    else:
        print(f"Skipping {source_folder}: Folder not found.")

print("\nAll conversions complete!")