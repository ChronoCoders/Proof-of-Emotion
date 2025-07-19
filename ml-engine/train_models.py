#!/usr/bin/env python3
"""
EmotionalChain ML Model Training Script
Train emotion classification models for PoE consensus
"""

import os
import pandas as pd
from pathlib import Path
from emotion_classifier import EmotionClassifier
from data_processing import BiometricDataProcessor
from training_data.generate_data import EmotionalDataGenerator

def main():
    print("🧠 EmotionalChain ML Model Training")
    print("=" * 50)
    
    # Setup directories
    ml_dir = Path(__file__).parent
    models_dir = ml_dir / "models"
    models_dir.mkdir(exist_ok=True)
    
    data_dir = ml_dir / "training_data"
    data_dir.mkdir(exist_ok=True)
    
    # Initialize components
    generator = EmotionalDataGenerator(str(data_dir))
    processor = BiometricDataProcessor()
    classifier = EmotionClassifier(model_type='ensemble')
    
    print("\n1. Generating training data...")
    
    # Check if training data already exists
    existing_data_files = list(data_dir.glob("emotionalchain_static_*.csv"))
    
    if existing_data_files:
        print(f"Found existing training data: {existing_data_files[0]}")
        training_data = pd.read_csv(existing_data_files[0])
        print(f"Loaded {len(training_data)} samples from existing data")
    else:
        print("Generating new training data...")
        # Generate comprehensive dataset
        datasets = generator.create_comprehensive_dataset(
            base_samples=800,      # 800 samples per emotion (4800 total)
            temporal_sequences=5,  # 5 temporal sequences
            individuals=30         # 30 different individuals
        )
        
        # Export datasets
        generator.export_datasets(datasets, "emotionalchain")
        training_data = datasets['static']
        print(f"Generated {len(training_data)} training samples")
    
    print(f"\nEmotion distribution:")
    print(training_data['emotion'].value_counts())
    
    print("\n2. Training ML models...")
    
    # Prepare training data
    feature_columns = [
        'heart_rate', 'hrv', 'skin_conductance', 'movement',
        'respiratory_rate', 'temperature', 'acceleration_x', 
        'acceleration_y', 'acceleration_z', 'ambient_light'
    ]
    
    # Ensure all required columns exist
    for col in feature_columns:
        if col not in training_data.columns:
            if col == 'respiratory_rate':
                training_data[col] = 14 + (training_data['heart_rate'] - 70) * 0.1
            elif col == 'temperature':
                training_data[col] = 36.5 + (training_data['heart_rate'] - 70) * 0.01
            elif col in ['acceleration_x', 'acceleration_y']:
                training_data[col] = 0
            elif col == 'acceleration_z':
                training_data[col] = 9.8
            elif col == 'ambient_light':
                training_data[col] = 0.5
    
    # Train models
    results = classifier.train_models(training_data)
    
    print("\n3. Model Training Results:")
    for model_name, metrics in results.items():
        print(f"\n{model_name}:")
        print(f"  Train Accuracy: {metrics['train_accuracy']:.3f}")
        print(f"  Test Accuracy:  {metrics['test_accuracy']:.3f}")
        print(f"  CV Score:       {metrics['cv_mean']:.3f} ± {metrics['cv_std']:.3f}")
    
    print("\n4. Saving trained models...")
    model_path = models_dir / "emotionalchain_models.pkl"
    classifier.save_models(str(model_path))
    
    print("\n5. Testing model inference...")
    # Test with sample data
    test_data = {
        'heart_rate': 85,
        'hrv': 25,
        'skin_conductance': 0.6,
        'movement': 0.3,
        'respiratory_rate': 18,
        'temperature': 36.8,
        'acceleration_x': 0.1,
        'acceleration_y': -0.1,
        'acceleration_z': 9.9,
        'ambient_light': 0.7
    }
    
    processed_data = processor.process_realtime_data(test_data)
    emotional_metrics = classifier.calculate_emotional_metrics(processed_data)
    readiness = classifier.predict_consensus_readiness(processed_data)
    
    print(f"\nTest inference results:")
    print(f"Input: HR={test_data['heart_rate']}, HRV={test_data['hrv']}, GSR={test_data['skin_conductance']}")
    print(f"Output: Stress={emotional_metrics['stress']}%, Energy={emotional_metrics['energy']}%, Focus={emotional_metrics['focus']}%")
    print(f"Emotion: {emotional_metrics['emotion_category']} (confidence: {emotional_metrics['confidence']:.3f})")
    print(f"Authenticity: {emotional_metrics['authenticity']}%")
    print(f"Consensus Ready: {readiness['consensus_ready']} (score: {readiness['readiness_score']})")
    
    print("\n6. Creating model metadata...")
    metadata = {
        'model_info': {
            'version': '2.0.0',
            'training_date': pd.Timestamp.now().isoformat(),
            'total_samples': len(training_data),
            'emotion_categories': list(training_data['emotion'].unique()),
            'features': feature_columns,
            'model_types': list(results.keys())
        },
        'performance': results,
        'test_results': {
            'sample_input': test_data,
            'emotional_metrics': emotional_metrics,
            'consensus_readiness': readiness
        }
    }
    
    import json
    metadata_path = models_dir / "model_metadata.json"
    with open(metadata_path, 'w') as f:
        json.dump(metadata, f, indent=2, default=str)
    
    print(f"Model metadata saved to: {metadata_path}")
    
    print("\n✅ ML Model Training Complete!")
    print(f"📁 Models saved to: {model_path}")
    print(f"📊 Training data: {len(training_data)} samples")
    print(f"🎯 Best model accuracy: {max([r['test_accuracy'] for r in results.values()]):.3f}")
    
    print("\n🚀 Next steps:")
    print("1. Restart your EmotionalChain server")
    print("2. Check ML engine status: GET /api/ml/status")
    print("3. Test emotion classification: POST /api/ml/test-emotion")
    print("4. Register validators and watch AI-enhanced consensus!")
    
    return True

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"❌ Training failed: {e}")
        import traceback
        traceback.print_exc()