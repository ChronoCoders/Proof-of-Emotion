#!/usr/bin/env python3
"""
EmotionalChain ML Engine Setup Script
Install dependencies and train initial models
"""

import os
import sys
import subprocess
import json
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 7):
        print("❌ Python 3.7 or higher is required")
        return False
    print(f"Python {sys.version_info.major}.{sys.version_info.minor} detected")
    return True

def install_dependencies():
    """Install required Python packages"""
    required_packages = [
        'numpy>=1.19.0',
        'pandas>=1.2.0',
        'scikit-learn>=1.0.0',
        'scipy>=1.7.0',
        'matplotlib>=3.3.0',
        'seaborn>=0.11.0',
        'joblib>=1.0.0'
    ]
    
    print("\nInstalling ML dependencies...")
    for package in required_packages:
        try:
            print(f"Installing {package}...")
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', package, '--quiet'
            ])
            print(f"{package} installed")
        except subprocess.CalledProcessError as e:
            print(f"Failed to install {package}: {e}")
            return False
    
    print("All dependencies installed successfully")
    return True

def create_directory_structure():
    """Create necessary directories"""
    directories = [
        'ml-engine',
        'ml-engine/models',
        'ml-engine/training_data',
        'ml-engine/logs'
    ]
    
    print("\nCreating directory structure...")
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)
        print(f"Created {directory}/")
    
    return True

def copy_ml_files():
    """Instructions for copying ML files"""
    print("\nML Engine Files Setup:")
    print("Please ensure these files are in the ml-engine/ directory:")
    
    required_files = [
        'ml-engine/emotion_classifier.py',
        'ml-engine/data_processing.py',
        'ml-engine/inference.py',
        'ml-engine/train_models.py',
        'ml-engine/training_data/generate_data.py'
    ]
    
    missing_files = []
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"{file_path}")
        else:
            print(f"{file_path} - MISSING")
            missing_files.append(file_path)
    
    if missing_files:
        print(f"\nMissing {len(missing_files)} required files")
        print("Please copy the ML engine files to the correct locations")
        return False
    
    return True

def test_ml_imports():
    """Test if ML modules can be imported"""
    print("\nTesting ML module imports...")
    
    try:
        # Add ml-engine to path
        sys.path.insert(0, str(Path('ml-engine').absolute()))
        
        # Test imports
        print("Testing imports...")
        
        import numpy
        print("numpy")
        
        import pandas
        print("pandas")
        
        import sklearn
        print("scikit-learn")
        
        # Test custom modules
        from emotion_classifier import EmotionClassifier
        print("emotion_classifier")
        
        from data_processing import BiometricDataProcessor
        print("data_processing")
        
        # Test basic functionality
        print("\nTesting basic functionality...")
        classifier = EmotionClassifier()
        processor = BiometricDataProcessor()
        
        # Test data processing
        test_data = {
            'heart_rate': 75,
            'hrv': 35,
            'skin_conductance': 0.4,
            'movement': 0.2
        }
        
        processed = processor.process_realtime_data(test_data)
        print("Data processing")
        
        # Test emotion calculation (rule-based)
        metrics = classifier.calculate_emotional_metrics(processed)
        print("Emotion calculation")
        
        print(f"Test result: Stress={metrics['stress']}%, Energy={metrics['energy']}%, Focus={metrics['focus']}%")
        
        return True
        
    except ImportError as e:
        print(f"Import error: {e}")
        return False
    except Exception as e:
        print(f"Functionality test failed: {e}")
        return False

def train_initial_models():
    """Train initial ML models"""
    print("\nTraining initial ML models...")
    
    try:
        # Add ml-engine to path
        sys.path.insert(0, str(Path('ml-engine').absolute()))
        
        # Import training script
        from train_models import main as train_main
        
        print("Starting model training...")
        success = train_main()
        
        if success:
            print("Model training completed successfully")
            return True
        else:
            print("Model training failed")
            return False
            
    except Exception as e:
        print(f"Training error: {e}")
        print("You can train models manually later using: python ml-engine/train_models.py")
        return False

def create_package_json_scripts():
    """Add ML-related scripts to package.json"""
    print("\nAdding ML scripts to package.json...")
    
    package_json_path = Path('package.json')
    if not package_json_path.exists():
        print("package.json not found")
        return False
    
    try:
        with open(package_json_path, 'r') as f:
            package_data = json.load(f)
        
        # Add ML scripts
        if 'scripts' not in package_data:
            package_data['scripts'] = {}
        
        ml_scripts = {
            "ml:setup": "python setup_ml_engine.py",
            "ml:train": "python ml-engine/train_models.py",
            "ml:test": "python -c \"import sys; sys.path.append('ml-engine'); from emotion_classifier import EmotionClassifier; print('ML Engine OK')\"",
            "ml:generate-data": "python ml-engine/training_data/generate_data.py"
        }
        
        package_data['scripts'].update(ml_scripts)
        
        with open(package_json_path, 'w') as f:
            json.dump(package_data, f, indent=2)
        
        print("Added ML scripts to package.json:")
        for script, command in ml_scripts.items():
            print(f"  npm run {script}")
        
        return True
        
    except Exception as e:
        print(f"Failed to update package.json: {e}")
        return False

def main():
    """Main setup function"""
    print("EmotionalChain ML Engine Setup")
    print("=" * 50)
    
    # Step 1: Check Python version
    if not check_python_version():
        return False
    
    # Step 2: Install dependencies
    if not install_dependencies():
        return False
    
    # Step 3: Create directories
    if not create_directory_structure():
        return False
    
    # Step 4: Check ML files
    if not copy_ml_files():
        print("\nSetup incomplete - missing ML files")
        print("Please copy the ML engine files and run setup again")
        return False
    
    # Step 5: Test imports
    if not test_ml_imports():
        return False
    
    # Step 6: Add npm scripts
    create_package_json_scripts()
    
    # Step 7: Train initial models
    print("\nWould you like to train ML models now? (y/n)")
    response = input().lower().strip()
    
    if response in ['y', 'yes']:
        train_success = train_initial_models()
    else:
        print("Skipping model training. You can train later with: npm run ml:train")
        train_success = True
    
    # Final summary
    print("\n" + "=" * 50)
    if train_success:
        print("EmotionalChain ML Engine Setup Complete!")
        print("\nSetup Summary:")
        print("  - Python dependencies installed")
        print("  - Directory structure created")
        print("  - ML modules tested successfully")
        print("  - Initial models trained" if response in ['y', 'yes'] else "  - Models ready for training")
        
        print("\nNext Steps:")
        print("1. Start your EmotionalChain server: npm run dev")
        print("2. Check ML status: GET http://localhost:5000/api/ml/status")
        print("3. Test emotion classification: POST http://localhost:5000/api/ml/test-emotion")
        print("4. Register validators and experience AI-enhanced PoE consensus!")
        
        print("\nAvailable ML Commands:")
        print("  npm run ml:train     - Train/retrain models")
        print("  npm run ml:test      - Test ML engine")
        print("  npm run ml:generate-data - Generate training data")
        
    else:
        print("Setup completed with issues")
        print("Please check the errors above and run setup again")
    
    return train_success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)