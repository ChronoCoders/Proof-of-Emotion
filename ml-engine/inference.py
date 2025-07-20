#!/usr/bin/env python3
import sys
import json
import os
import numpy as np
from pathlib import Path

try:
    from emotion_classifier import EmotionClassifier
    from data_processing import BiometricDataProcessor
except ImportError:
    print(json.dumps({
        "error": "ML dependencies not available",
        "stress": 50,
        "energy": 50,
        "focus": 50,
        "authenticity": 80,
        "confidence": 0.5,
        "emotion_category": "unknown"
    }))
    sys.exit(0)

def main():
    try:
        # Read input from stdin
        if sys.stdin.isatty():
            # No input detected, use test data
            input_data = '{"heart_rate": 75, "hrv": 35, "skin_conductance": 0.4, "movement": 0.2}'
        else:
            input_data = sys.stdin.read().strip()
        
        if not input_data:
            raise ValueError("No input data received")
            
        biometric_data = json.loads(input_data)
        
        # Initialize ML components
        model_path = os.path.join(os.path.dirname(__file__), 'models', 'emotionalchain_models.pkl')
        
        classifier = EmotionClassifier(model_type='ensemble')
        processor = BiometricDataProcessor()
        
        # Load trained models (silently)
        if os.path.exists(model_path):
            classifier.load_models(model_path)
        
        # Process biometric data
        processed_data = processor.process_realtime_data(biometric_data)
        
        # Calculate emotional metrics
        if classifier.is_trained:
            emotional_metrics = classifier.calculate_emotional_metrics(processed_data)
            readiness_assessment = classifier.predict_consensus_readiness(processed_data)
            
            response = {
                "stress": int(emotional_metrics["stress"]),
                "energy": int(emotional_metrics["energy"]), 
                "focus": int(emotional_metrics["focus"]),
                "authenticity": int(emotional_metrics["authenticity"]),
                "confidence": float(emotional_metrics["confidence"]),
                "emotion_category": str(emotional_metrics["emotion_category"]),
                "ml_prediction": int(emotional_metrics.get("ml_prediction", 0)),
                "consensus_ready": bool(readiness_assessment["consensus_ready"]),
                "readiness_score": int(readiness_assessment["readiness_score"]),
                "ml_used": True
            }
        else:
            # Fallback to rule-based calculation
            emotional_metrics = calculate_rule_based_emotions(biometric_data)
            response = {
                "stress": emotional_metrics["stress"],
                "energy": emotional_metrics["energy"],
                "focus": emotional_metrics["focus"], 
                "authenticity": emotional_metrics["authenticity"],
                "confidence": 0.85,
                "emotion_category": emotional_metrics["emotion_category"],
                "consensus_ready": emotional_metrics["authenticity"] >= 80,
                "readiness_score": 75,
                "ml_used": False
            }
        
        # Output ONLY JSON to stdout
        print(json.dumps(response))
        
    except Exception as e:
        # Error fallback - only JSON to stdout
        error_response = {
            "error": str(e),
            "stress": 50,
            "energy": 50,
            "focus": 50,
            "authenticity": 70,
            "confidence": 0.5,
            "emotion_category": "error",
            "consensus_ready": False,
            "readiness_score": 0,
            "ml_used": False
        }
        print(json.dumps(error_response))
        sys.exit(1)

def calculate_rule_based_emotions(biometric_data):
    """Fallback rule-based emotion calculation"""
    heart_rate = biometric_data.get('heart_rate', 70)
    hrv = biometric_data.get('hrv', 30)
    skin_conductance = biometric_data.get('skin_conductance', 0.5)
    movement = biometric_data.get('movement', 0.1)
    
    # Stress calculation
    stress = 0
    if heart_rate > 100: stress += 30
    if heart_rate > 120: stress += 20
    if hrv < 20: stress += 25
    if skin_conductance > 0.7: stress += 25
    stress = min(stress, 100)
    
    # Energy calculation
    energy = 50
    if 80 <= heart_rate <= 100: energy += 20
    if movement > 0.5: energy += 15
    if hrv > 40: energy += 15
    energy = min(energy, 100)
    
    # Focus calculation
    focus = 70
    if hrv > 30 and stress < 30: focus += 20
    if stress > 70: focus -= 30
    if movement < 0.2: focus += 10
    focus = max(0, min(focus, 100))
    
    # Authenticity calculation
    authenticity = 100
    if heart_rate % 5 == 0: authenticity -= 10
    if heart_rate < 40 or heart_rate > 200: authenticity -= 30
    authenticity = max(authenticity, 0)
    
    # Determine emotion category
    emotion_category = 'neutral'
    if stress > 70:
        emotion_category = 'stressed'
    elif stress < 20 and energy < 40:
        emotion_category = 'calm'
    elif focus > 80 and stress < 40:
        emotion_category = 'focused'
    elif energy > 80:
        emotion_category = 'excited'
    
    return {
        'stress': int(stress),
        'energy': int(energy),
        'focus': int(focus),
        'authenticity': int(authenticity),
        'emotion_category': emotion_category
    }

if __name__ == "__main__":
    main()