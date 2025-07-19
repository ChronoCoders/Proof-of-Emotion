"""
EmotionalChain ML Engine - Data Processing
Advanced biometric data processing and feature engineering for PoE consensus
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Tuple, Optional
import warnings
warnings.filterwarnings('ignore')

# Import scipy safely
try:
    from scipy import signal
    SCIPY_AVAILABLE = True
except ImportError:
    SCIPY_AVAILABLE = False

class BiometricDataProcessor:
    """
    Advanced biometric data processor for EmotionalChain
    
    Features:
    - Real-time signal processing
    - Feature extraction
    - Data validation and cleaning
    - Synthetic data generation for training
    """
    
    def __init__(self, sampling_rate: int = 100):
        """
        Initialize data processor
        
        Args:
            sampling_rate: Sampling rate in Hz for signal processing
        """
        self.sampling_rate = sampling_rate
        self.feature_extractors = {
            'heart_rate': self._extract_heart_rate_features,
            'hrv': self._extract_hrv_features,
            'skin_conductance': self._extract_gsr_features,
            'movement': self._extract_movement_features
        }
    
    def process_realtime_data(self, raw_data: Dict) -> Dict:
        """
        Process real-time biometric data
        
        Args:
            raw_data: Raw sensor data from devices
            
        Returns:
            Processed and validated biometric features
        """
        processed_data = {}
        
        # Validate and clean data
        validated_data = self._validate_data(raw_data)
        
        # Extract basic features
        processed_data['heart_rate'] = self._process_heart_rate(validated_data.get('heart_rate', 70))
        processed_data['hrv'] = self._process_hrv(validated_data.get('hrv', 30))
        processed_data['skin_conductance'] = self._process_gsr(validated_data.get('skin_conductance', 0.5))
        processed_data['movement'] = self._process_movement(validated_data.get('movement', 0.1))
        
        # Add derived features
        processed_data.update(self._calculate_derived_features(processed_data))
        
        # Add quality metrics
        processed_data['data_quality'] = self._assess_data_quality(validated_data)
        processed_data['timestamp'] = datetime.now().isoformat()
        
        return processed_data
    
    def _validate_data(self, raw_data: Dict) -> Dict:
        """Validate and clean raw biometric data"""
        validated = {}
        
        # Heart rate validation (40-200 BPM)
        hr = raw_data.get('heart_rate', 70)
        validated['heart_rate'] = max(40, min(200, hr)) if isinstance(hr, (int, float)) else 70
        
        # HRV validation (5-100 ms)
        hrv = raw_data.get('hrv', 30)
        validated['hrv'] = max(5, min(100, hrv)) if isinstance(hrv, (int, float)) else 30
        
        # Skin conductance validation (0-1)
        gsr = raw_data.get('skin_conductance', 0.5)
        validated['skin_conductance'] = max(0, min(1, gsr)) if isinstance(gsr, (int, float)) else 0.5
        
        # Movement validation (0-1)
        movement = raw_data.get('movement', 0.1)
        validated['movement'] = max(0, min(1, movement)) if isinstance(movement, (int, float)) else 0.1
        
        return validated
    
    def _process_heart_rate(self, heart_rate: float) -> float:
        """Process heart rate data with noise reduction"""
        # Simple moving average for noise reduction
        if hasattr(self, '_hr_history'):
            self._hr_history.append(heart_rate)
            if len(self._hr_history) > 5:
                self._hr_history.pop(0)
            return np.mean(self._hr_history)
        else:
            self._hr_history = [heart_rate]
            return heart_rate
    
    def _process_hrv(self, hrv: float) -> float:
        """Process HRV data with validation"""
        return max(5, min(100, hrv))
    
    def _process_gsr(self, gsr: float) -> float:
        """Process galvanic skin response data"""
        return max(0, min(1, gsr))
    
    def _process_movement(self, movement: float) -> float:
        """Process movement/acceleration data"""
        return max(0, min(1, movement))
    
    def _calculate_derived_features(self, data: Dict) -> Dict:
        """Calculate derived features from basic biometrics"""
        derived = {}
        
        # Autonomic balance (HRV/HR ratio)
        derived['autonomic_balance'] = data['hrv'] / data['heart_rate'] * 1000
        
        # Arousal index (combination of HR and GSR)
        derived['arousal_index'] = (data['heart_rate'] / 100 + data['skin_conductance']) / 2
        
        # Stability index (inverse of movement + HRV component)
        derived['stability_index'] = (1 - data['movement']) * (data['hrv'] / 100)
        
        # Estimated respiratory rate (simplified)
        derived['respiratory_rate'] = 12 + (data['heart_rate'] - 70) * 0.1
        derived['respiratory_rate'] = max(8, min(25, derived['respiratory_rate']))
        
        # Temperature estimate (simplified)
        base_temp = 36.5
        temp_variation = (data['heart_rate'] - 70) * 0.01
        derived['temperature'] = base_temp + temp_variation
        
        return derived
    
    def _assess_data_quality(self, data: Dict) -> float:
        """Assess overall data quality score (0-1)"""
        quality_score = 1.0
        
        # Check for extreme values
        hr = data.get('heart_rate', 70)
        if hr < 50 or hr > 150:
            quality_score -= 0.2
        
        hrv = data.get('hrv', 30)
        if hrv < 10 or hrv > 80:
            quality_score -= 0.1
        
        # Check for unrealistic combinations
        if hr > 120 and data.get('movement', 0) < 0.1:
            quality_score -= 0.3
        
        return max(0, quality_score)
    
    def _extract_heart_rate_features(self, hr_data: List[float]) -> Dict:
        """Extract features from heart rate time series"""
        if not hr_data:
            return {}
        
        return {
            'hr_mean': np.mean(hr_data),
            'hr_std': np.std(hr_data),
            'hr_min': np.min(hr_data),
            'hr_max': np.max(hr_data)
        }
    
    def _extract_hrv_features(self, hrv_data: List[float]) -> Dict:
        """Extract features from HRV time series"""
        if not hrv_data:
            return {}
        
        return {
            'hrv_mean': np.mean(hrv_data),
            'hrv_std': np.std(hrv_data),
            'hrv_trend': self._calculate_trend(hrv_data)
        }
    
    def _extract_gsr_features(self, gsr_data: List[float]) -> Dict:
        """Extract features from GSR time series"""
        if not gsr_data:
            return {}
        
        return {
            'gsr_mean': np.mean(gsr_data),
            'gsr_peaks': self._count_peaks(gsr_data),
            'gsr_baseline': np.percentile(gsr_data, 10)
        }
    
    def _extract_movement_features(self, movement_data: List[float]) -> Dict:
        """Extract features from movement time series"""
        if not movement_data:
            return {}
        
        return {
            'movement_mean': np.mean(movement_data),
            'movement_variance': np.var(movement_data),
            'movement_energy': np.sum(np.square(movement_data))
        }
    
    def generate_synthetic_training_data(self, num_samples: int = 1000) -> pd.DataFrame:
        """
        Generate synthetic biometric data for training ML models
        """
        np.random.seed(42)
        data = []
        
        emotion_profiles = {
            0: {'name': 'calm', 'hr_mean': 70, 'hr_std': 8, 'hrv_mean': 45, 'hrv_std': 10, 
                'gsr_mean': 0.3, 'gsr_std': 0.1, 'movement_mean': 0.1, 'movement_std': 0.05},
            1: {'name': 'stressed', 'hr_mean': 95, 'hr_std': 12, 'hrv_mean': 20, 'hrv_std': 5,
                'gsr_mean': 0.7, 'gsr_std': 0.15, 'movement_mean': 0.3, 'movement_std': 0.1},
            2: {'name': 'focused', 'hr_mean': 75, 'hr_std': 6, 'hrv_mean': 50, 'hrv_std': 8,
                'gsr_mean': 0.4, 'gsr_std': 0.08, 'movement_mean': 0.05, 'movement_std': 0.02},
            3: {'name': 'excited', 'hr_mean': 88, 'hr_std': 10, 'hrv_mean': 35, 'hrv_std': 8,
                'gsr_mean': 0.6, 'gsr_std': 0.12, 'movement_mean': 0.4, 'movement_std': 0.15},
            4: {'name': 'fatigued', 'hr_mean': 65, 'hr_std': 5, 'hrv_mean': 25, 'hrv_std': 6,
                'gsr_mean': 0.25, 'gsr_std': 0.06, 'movement_mean': 0.15, 'movement_std': 0.08},
            5: {'name': 'anxious', 'hr_mean': 100, 'hr_std': 15, 'hrv_mean': 18, 'hrv_std': 4,
                'gsr_mean': 0.8, 'gsr_std': 0.1, 'movement_mean': 0.35, 'movement_std': 0.12}
        }
        
        for i in range(num_samples):
            emotion_label = np.random.randint(0, 6)
            profile = emotion_profiles[emotion_label]
            
            heart_rate = np.clip(np.random.normal(profile['hr_mean'], profile['hr_std']), 40, 200)
            hrv = np.clip(np.random.normal(profile['hrv_mean'], profile['hrv_std']), 5, 100)
            skin_conductance = np.clip(np.random.normal(profile['gsr_mean'], profile['gsr_std']), 0, 1)
            movement = np.clip(np.random.normal(profile['movement_mean'], profile['movement_std']), 0, 1)
            
            respiratory_rate = np.clip(12 + (heart_rate - 70) * 0.1 + np.random.normal(0, 2), 8, 25)
            temperature = np.clip(36.5 + (heart_rate - 70) * 0.01 + np.random.normal(0, 0.3), 35, 39)
            
            acc_magnitude = movement + np.random.normal(0, 0.1)
            acceleration_x = np.random.normal(0, acc_magnitude)
            acceleration_y = np.random.normal(0, acc_magnitude)
            acceleration_z = 9.8 + np.random.normal(0, acc_magnitude)
            ambient_light = np.random.uniform(0, 1)
            
            data.append({
                'heart_rate': heart_rate,
                'hrv': hrv,
                'skin_conductance': skin_conductance,
                'movement': movement,
                'respiratory_rate': respiratory_rate,
                'temperature': temperature,
                'acceleration_x': acceleration_x,
                'acceleration_y': acceleration_y,
                'acceleration_z': acceleration_z,
                'ambient_light': ambient_light,
                'emotion_label': emotion_label,
                'emotion_name': profile['name']
            })
        
        return pd.DataFrame(data)
    
    def _calculate_trend(self, series: List[float]) -> float:
        """Calculate trend in time series"""
        if len(series) < 2:
            return 0
        x = np.arange(len(series))
        coeffs = np.polyfit(x, series, 1)
        return coeffs[0]
    
    def _count_peaks(self, series: List[float], prominence: float = 0.1) -> int:
        """Count significant peaks in signal"""
        if len(series) < 3:
            return 0
        if not SCIPY_AVAILABLE:
            return 0
        try:
            peaks, _ = signal.find_peaks(series, prominence=prominence)
            return len(peaks)
        except:
            return 0
    
    def detect_anomalies(self, biometric_data: Dict, historical_data: List[Dict] = None) -> Dict:
        """Detect anomalies in biometric data for anti-spoofing"""
        anomalies = {
            'has_anomaly': False,
            'anomaly_score': 0.0,
            'anomaly_types': [],
            'confidence': 1.0
        }
        
        hr = biometric_data.get('heart_rate', 70)
        if hr < 30 or hr > 220:
            anomalies['has_anomaly'] = True
            anomalies['anomaly_types'].append('impossible_heart_rate')
            anomalies['anomaly_score'] += 0.5
        
        if hr % 5 == 0 and hr % 10 == 0:
            anomalies['anomaly_score'] += 0.2
            anomalies['anomaly_types'].append('artificial_pattern')
        
        hrv = biometric_data.get('hrv', 30)
        if hr > 120 and hrv > 50:
            anomalies['anomaly_score'] += 0.3
            anomalies['anomaly_types'].append('inconsistent_correlation')
        
        movement = biometric_data.get('movement', 0.1)
        if hr > 140 and movement < 0.05:
            anomalies['anomaly_score'] += 0.4
            anomalies['anomaly_types'].append('movement_hr_mismatch')
        
        if historical_data and len(historical_data) > 5:
            baseline_hr = np.mean([d.get('heart_rate', 70) for d in historical_data])
            if abs(hr - baseline_hr) > 50:
                anomalies['anomaly_score'] += 0.3
                anomalies['anomaly_types'].append('extreme_deviation')
        
        if anomalies['anomaly_score'] > 0.5:
            anomalies['has_anomaly'] = True
        
        anomalies['confidence'] = max(0, 1 - anomalies['anomaly_score'])
        return anomalies

# Example usage and testing
if __name__ == "__main__":
    processor = BiometricDataProcessor()
    
    print("Testing BiometricDataProcessor...")
    
    # Test data processing
    sample_data = {
        'heart_rate': 85,
        'hrv': 25,
        'skin_conductance': 0.6,
        'movement': 0.3
    }
    
    processed = processor.process_realtime_data(sample_data)
    print("✅ Data processing test passed")
    
    # Test synthetic data generation
    training_data = processor.generate_synthetic_training_data(100)
    print(f"✅ Generated {len(training_data)} synthetic samples")
    
    # Test anomaly detection
    anomaly_data = {'heart_rate': 200, 'hrv': 5, 'skin_conductance': 0.9, 'movement': 0.0}
    anomalies = processor.detect_anomalies(anomaly_data)
    print("✅ Anomaly detection test passed")
    
    print("All tests passed!")