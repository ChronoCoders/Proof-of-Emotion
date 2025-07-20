"""
EmotionalChain ML Engine - Emotion Classifier
Advanced emotion classification using machine learning for PoE consensus
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.preprocessing import StandardScaler, MinMaxScaler
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import joblib
import json
from datetime import datetime
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

class EmotionClassifier:
    """
    Advanced emotion classifier for EmotionalChain PoE consensus
    """
    
    def __init__(self, model_type: str = 'ensemble', verbose: bool = False):
        self.model_type = model_type
        self.verbose = verbose
        self.models = {}
        self.scalers = {}
        self.is_trained = False
        self.feature_names = [
            'heart_rate', 'hrv', 'skin_conductance', 'movement',
            'respiratory_rate', 'temperature', 'acceleration_x', 
            'acceleration_y', 'acceleration_z', 'ambient_light'
        ]
        
        self.emotion_categories = {
            0: 'calm',
            1: 'stressed', 
            2: 'focused',
            3: 'excited',
            4: 'fatigued',
            5: 'anxious'
        }
        
        self._initialize_models()
    
    def _initialize_models(self):
        if self.model_type == 'random_forest' or self.model_type == 'ensemble':
            self.models['random_forest'] = RandomForestClassifier(
                n_estimators=100,
                max_depth=10,
                min_samples_split=5,
                min_samples_leaf=2,
                random_state=42
            )
        
        if self.model_type == 'gradient_boost' or self.model_type == 'ensemble':
            self.models['gradient_boost'] = GradientBoostingClassifier(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42
            )
        
        if self.model_type == 'neural_network' or self.model_type == 'ensemble':
            self.models['neural_network'] = MLPClassifier(
                hidden_layer_sizes=(100, 50, 25),
                activation='relu',
                solver='adam',
                alpha=0.001,
                batch_size='auto',
                learning_rate='constant',
                learning_rate_init=0.001,
                max_iter=1000,
                random_state=42
            )
        
        for model_name in self.models.keys():
            if model_name == 'neural_network':
                self.scalers[model_name] = StandardScaler()
            else:
                self.scalers[model_name] = MinMaxScaler()
    
    def preprocess_biometric_data(self, biometric_data: Dict) -> np.ndarray:
        features = []
        
        features.append(biometric_data.get('heart_rate', 70))
        features.append(biometric_data.get('hrv', 30))
        features.append(biometric_data.get('skin_conductance', 0.5))
        features.append(biometric_data.get('movement', 0.1))
        features.append(biometric_data.get('respiratory_rate', 16))
        features.append(biometric_data.get('temperature', 36.5))
        features.append(biometric_data.get('acceleration_x', 0))
        features.append(biometric_data.get('acceleration_y', 0))
        features.append(biometric_data.get('acceleration_z', 9.8))
        features.append(biometric_data.get('ambient_light', 0.5))
        
        return np.array(features).reshape(1, -1)
    
    def calculate_emotional_metrics(self, biometric_data: Dict) -> Dict:
        if not self.is_trained:
            return self._rule_based_emotions(biometric_data)
        
        features = self.preprocess_biometric_data(biometric_data)
        predictions = {}
        confidences = {}
        
        for model_name, model in self.models.items():
            scaled_features = self.scalers[model_name].transform(features)
            
            prediction = model.predict(scaled_features)[0]
            prob_distribution = model.predict_proba(scaled_features)[0]
            
            predictions[model_name] = prediction
            confidences[model_name] = np.max(prob_distribution)
        
        if len(predictions) > 1:
            final_prediction = max(set(predictions.values()), 
                                 key=list(predictions.values()).count)
            avg_confidence = np.mean(list(confidences.values()))
        else:
            final_prediction = list(predictions.values())[0]
            avg_confidence = list(confidences.values())[0]
        
        emotion_metrics = self._convert_to_poe_metrics(
            final_prediction, avg_confidence, biometric_data
        )
        
        return emotion_metrics
    
    def _rule_based_emotions(self, biometric_data: Dict) -> Dict:
        heart_rate = biometric_data.get('heart_rate', 70)
        hrv = biometric_data.get('hrv', 30)
        skin_conductance = biometric_data.get('skin_conductance', 0.5)
        movement = biometric_data.get('movement', 0.1)
        
        stress = 0
        if heart_rate > 100: stress += 30
        if heart_rate > 120: stress += 20
        if hrv < 20: stress += 25
        if skin_conductance > 0.7: stress += 25
        stress = min(stress, 100)
        
        energy = 50
        if 80 <= heart_rate <= 100: energy += 20
        if movement > 0.5: energy += 15
        if hrv > 40: energy += 15
        energy = min(energy, 100)
        
        focus = 70
        if hrv > 30 and stress < 30: focus += 20
        if stress > 70: focus -= 30
        if movement < 0.2: focus += 10
        focus = max(0, min(focus, 100))
        
        authenticity = 100
        if heart_rate % 5 == 0: authenticity -= 10
        if heart_rate < 40 or heart_rate > 200: authenticity -= 30
        authenticity = max(authenticity, 0)
        
        return {
            'stress': stress,
            'energy': energy,
            'focus': focus,
            'authenticity': authenticity,
            'confidence': 0.85,
            'emotion_category': 'rule_based'
        }
    
    def _convert_to_poe_metrics(self, emotion_prediction: int, 
                               confidence: float, biometric_data: Dict) -> Dict:
        
        emotion_name = self.emotion_categories.get(emotion_prediction, 'unknown')
        
        if emotion_name == 'calm':
            stress, energy, focus = 10, 60, 85
        elif emotion_name == 'stressed':
            stress, energy, focus = 85, 40, 30
        elif emotion_name == 'focused':
            stress, energy, focus = 20, 70, 95
        elif emotion_name == 'excited':
            stress, energy, focus = 30, 90, 70
        elif emotion_name == 'fatigued':
            stress, energy, focus = 40, 20, 40
        elif emotion_name == 'anxious':
            stress, energy, focus = 90, 50, 25
        else:
            stress, energy, focus = 50, 50, 50
        
        heart_rate = biometric_data.get('heart_rate', 70)
        if heart_rate > 100:
            stress = min(stress + 20, 100)
            energy = min(energy + 10, 100)
        
        authenticity = min(confidence * 100 + np.random.normal(0, 5), 100)
        authenticity = max(authenticity, 80)
        
        return {
            'stress': int(stress),
            'energy': int(energy),
            'focus': int(focus),
            'authenticity': int(authenticity),
            'confidence': confidence,
            'emotion_category': emotion_name,
            'ml_prediction': int(emotion_prediction)
        }
    
    def train_models(self, training_data: pd.DataFrame) -> Dict:
        if len(training_data) < 100 and self.verbose:
            print("Warning: Limited training data. Consider generating more samples.")
        
        X = training_data[self.feature_names].values
        y = training_data['emotion_label'].values
        
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
        
        results = {}
        
        for model_name, model in self.models.items():
            if self.verbose:
                print(f"Training {model_name}...")
            
            X_train_scaled = self.scalers[model_name].fit_transform(X_train)
            X_test_scaled = self.scalers[model_name].transform(X_test)
            
            model.fit(X_train_scaled, y_train)
            
            train_score = model.score(X_train_scaled, y_train)
            test_score = model.score(X_test_scaled, y_test)
            
            cv_scores = cross_val_score(model, X_train_scaled, y_train, cv=5)
            
            results[model_name] = {
                'train_accuracy': train_score,
                'test_accuracy': test_score,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std()
            }
            
            if self.verbose:
                print(f"{model_name}: Train={train_score:.3f}, Test={test_score:.3f}, CV={cv_scores.mean():.3f}±{cv_scores.std():.3f}")
        
        self.is_trained = True
        return results
    
    def save_models(self, filepath: str):
        model_data = {
            'models': self.models,
            'scalers': self.scalers,
            'model_type': self.model_type,
            'is_trained': self.is_trained,
            'feature_names': self.feature_names,
            'emotion_categories': self.emotion_categories
        }
        
        joblib.dump(model_data, filepath)
        if self.verbose:
            print(f"Models saved to {filepath}")
    
    def load_models(self, filepath: str):
        try:
            model_data = joblib.load(filepath)
            self.models = model_data['models']
            self.scalers = model_data['scalers']
            self.model_type = model_data['model_type']
            self.is_trained = model_data['is_trained']
            self.feature_names = model_data['feature_names']
            self.emotion_categories = model_data['emotion_categories']
            if self.verbose:
                print(f"Models loaded from {filepath}")
        except Exception as e:
            if self.verbose:
                print(f"Error loading models: {e}")
            self.is_trained = False
    
    def predict_consensus_readiness(self, biometric_data: Dict) -> Dict:
        metrics = self.calculate_emotional_metrics(biometric_data)
        
        readiness_score = 0
        
        if metrics['authenticity'] >= 90:
            readiness_score += 40
        elif metrics['authenticity'] >= 80:
            readiness_score += 25
        else:
            readiness_score += 10
        
        if metrics['stress'] < 50:
            readiness_score += 20
        elif metrics['stress'] < 70:
            readiness_score += 10
        
        if metrics['focus'] >= 70:
            readiness_score += 20
        elif metrics['focus'] >= 50:
            readiness_score += 10
        
        if 40 <= metrics['energy'] <= 80:
            readiness_score += 15
        elif 30 <= metrics['energy'] <= 90:
            readiness_score += 10
        
        if metrics['confidence'] >= 0.8:
            readiness_score += 5
        
        consensus_ready = readiness_score >= 70
        
        return {
            'consensus_ready': consensus_ready,
            'readiness_score': readiness_score,
            'emotional_metrics': metrics,
            'recommendation': self._get_recommendation(readiness_score, metrics)
        }
    
    def _get_recommendation(self, readiness_score: int, metrics: Dict) -> str:
        if readiness_score >= 80:
            return "Excellent consensus readiness. Participate immediately."
        elif readiness_score >= 70:
            return "Good consensus readiness. Safe to participate."
        elif readiness_score >= 50:
            return "Moderate readiness. Consider brief relaxation before consensus."
        elif metrics['authenticity'] < 80:
            return "Low authenticity detected. Check biometric sensors."
        elif metrics['stress'] > 70:
            return "High stress detected. Recommend stress reduction techniques."
        else:
            return "Low readiness. Take time for emotional regulation."

if __name__ == "__main__":
    classifier = EmotionClassifier(model_type='ensemble', verbose=True)
    
    sample_data = {
        'heart_rate': 75,
        'hrv': 35,
        'skin_conductance': 0.4,
        'movement': 0.2,
        'respiratory_rate': 14,
        'temperature': 36.8
    }
    
    metrics = classifier.calculate_emotional_metrics(sample_data)
    print("Emotional Metrics:", metrics)
    
    readiness = classifier.predict_consensus_readiness(sample_data)
    print("Consensus Readiness:", readiness)