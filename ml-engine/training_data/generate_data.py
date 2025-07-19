"""
EmotionalChain ML Engine - Training Data Generator
Generate comprehensive training datasets for emotion classification models
"""

import numpy as np
import pandas as pd
import json
from datetime import datetime, timedelta
from pathlib import Path
import matplotlib.pyplot as plt
import seaborn as sns
from typing import Dict, List, Tuple

class EmotionalDataGenerator:
    """
    Generate realistic training data for EmotionalChain ML models
    
    Features:
    - Physiologically realistic biometric patterns
    - Diverse emotional states and transitions
    - Temporal correlations and dependencies
    - Data augmentation and noise injection
    """
    
    def __init__(self, output_dir: str = "training_data"):
        """Initialize data generator"""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        
        # Emotion profiles with realistic biometric ranges
        self.emotion_profiles = {
            'calm': {
                'label': 0,
                'heart_rate': {'mean': 70, 'std': 8, 'min': 55, 'max': 85},
                'hrv': {'mean': 45, 'std': 10, 'min': 30, 'max': 65},
                'skin_conductance': {'mean': 0.3, 'std': 0.08, 'min': 0.15, 'max': 0.5},
                'movement': {'mean': 0.1, 'std': 0.05, 'min': 0, 'max': 0.25},
                'respiratory_rate': {'mean': 14, 'std': 2, 'min': 10, 'max': 18},
                'description': 'Relaxed, peaceful state with low arousal'
            },
            'focused': {
                'label': 1,
                'heart_rate': {'mean': 75, 'std': 6, 'min': 65, 'max': 90},
                'hrv': {'mean': 50, 'std': 8, 'min': 35, 'max': 70},
                'skin_conductance': {'mean': 0.4, 'std': 0.06, 'min': 0.25, 'max': 0.55},
                'movement': {'mean': 0.05, 'std': 0.02, 'min': 0, 'max': 0.15},
                'respiratory_rate': {'mean': 15, 'std': 1.5, 'min': 12, 'max': 18},
                'description': 'Concentrated attention with controlled arousal'
            },
            'excited': {
                'label': 2,
                'heart_rate': {'mean': 88, 'std': 10, 'min': 75, 'max': 110},
                'hrv': {'mean': 35, 'std': 8, 'min': 20, 'max': 50},
                'skin_conductance': {'mean': 0.6, 'std': 0.12, 'min': 0.4, 'max': 0.8},
                'movement': {'mean': 0.4, 'std': 0.15, 'min': 0.1, 'max': 0.7},
                'respiratory_rate': {'mean': 18, 'std': 3, 'min': 14, 'max': 24},
                'description': 'High positive arousal and energy'
            },
            'stressed': {
                'label': 3,
                'heart_rate': {'mean': 95, 'std': 12, 'min': 80, 'max': 120},
                'hrv': {'mean': 20, 'std': 5, 'min': 10, 'max': 35},
                'skin_conductance': {'mean': 0.7, 'std': 0.15, 'min': 0.5, 'max': 0.9},
                'movement': {'mean': 0.3, 'std': 0.1, 'min': 0.1, 'max': 0.6},
                'respiratory_rate': {'mean': 20, 'std': 4, 'min': 16, 'max': 28},
                'description': 'High negative arousal with physiological activation'
            },
            'anxious': {
                'label': 4,
                'heart_rate': {'mean': 100, 'std': 15, 'min': 85, 'max': 130},
                'hrv': {'mean': 18, 'std': 4, 'min': 10, 'max': 30},
                'skin_conductance': {'mean': 0.8, 'std': 0.1, 'min': 0.6, 'max': 0.95},
                'movement': {'mean': 0.35, 'std': 0.12, 'min': 0.15, 'max': 0.65},
                'respiratory_rate': {'mean': 22, 'std': 5, 'min': 18, 'max': 32},
                'description': 'Worry and apprehension with elevated arousal'
            },
            'fatigued': {
                'label': 5,
                'heart_rate': {'mean': 65, 'std': 5, 'min': 55, 'max': 80},
                'hrv': {'mean': 25, 'std': 6, 'min': 15, 'max': 40},
                'skin_conductance': {'mean': 0.25, 'std': 0.06, 'min': 0.15, 'max': 0.4},
                'movement': {'mean': 0.15, 'std': 0.08, 'min': 0.05, 'max': 0.35},
                'respiratory_rate': {'mean': 12, 'std': 2, 'min': 8, 'max': 16},
                'description': 'Low energy and reduced physiological activation'
            }
        }
    
    def generate_single_sample(self, emotion: str, add_noise: bool = True) -> Dict:
        """Generate a single biometric sample for given emotion"""
        if emotion not in self.emotion_profiles:
            raise ValueError(f"Unknown emotion: {emotion}")
        
        profile = self.emotion_profiles[emotion]
        sample = {'emotion': emotion, 'emotion_label': profile['label']}
        
        # Generate core biometric features
        for feature in ['heart_rate', 'hrv', 'skin_conductance', 'movement', 'respiratory_rate']:
            params = profile[feature]
            value = np.random.normal(params['mean'], params['std'])
            value = np.clip(value, params['min'], params['max'])
            
            # Add realistic noise if requested
            if add_noise:
                noise_factor = 0.02  # 2% noise
                noise = np.random.normal(0, value * noise_factor)
                value += noise
                value = np.clip(value, params['min'], params['max'])
            
            sample[feature] = round(value, 3)
        
        # Generate derived features
        sample.update(self._generate_derived_features(sample))
        
        # Add timestamp
        sample['timestamp'] = datetime.now().isoformat()
        
        return sample
    
    def _generate_derived_features(self, sample: Dict) -> Dict:
        """Generate derived features from core biometrics"""
        derived = {}
        
        # Temperature (body temperature varies with arousal)
        base_temp = 36.5
        hr_effect = (sample['heart_rate'] - 70) * 0.01
        activity_effect = sample['movement'] * 0.5
        derived['temperature'] = round(base_temp + hr_effect + activity_effect + 
                                     np.random.normal(0, 0.1), 2)
        derived['temperature'] = np.clip(derived['temperature'], 35.5, 38.5)
        
        # Acceleration components (related to movement)
        movement_magnitude = sample['movement']
        derived['acceleration_x'] = round(np.random.normal(0, movement_magnitude), 3)
        derived['acceleration_y'] = round(np.random.normal(0, movement_magnitude), 3)
        derived['acceleration_z'] = round(9.8 + np.random.normal(0, movement_magnitude * 0.5), 3)
        
        # Ambient light (random environmental factor)
        derived['ambient_light'] = round(np.random.uniform(0.1, 1.0), 3)
        
        # Blood oxygen (simplified, inversely related to stress)
        stress_proxy = (sample['heart_rate'] - 60) / 60 + sample['skin_conductance']
        base_spo2 = 98
        derived['blood_oxygen'] = round(base_spo2 - stress_proxy * 2 + 
                                      np.random.normal(0, 0.5), 1)
        derived['blood_oxygen'] = np.clip(derived['blood_oxygen'], 92, 100)
        
        return derived
    
    def generate_balanced_dataset(self, samples_per_emotion: int = 1000,
                                add_noise: bool = True) -> pd.DataFrame:
        """Generate balanced dataset with equal samples per emotion"""
        all_samples = []
        
        for emotion in self.emotion_profiles.keys():
            print(f"Generating {samples_per_emotion} samples for {emotion}...")
            for _ in range(samples_per_emotion):
                sample = self.generate_single_sample(emotion, add_noise)
                all_samples.append(sample)
        
        df = pd.DataFrame(all_samples)
        return df.sample(frac=1).reset_index(drop=True)  # Shuffle
    
    def generate_temporal_sequence(self, duration_minutes: int = 10,
                                 sampling_rate_hz: float = 1.0,
                                 emotion_transitions: List[Tuple[str, int]] = None) -> pd.DataFrame:
        """
        Generate temporal sequence with emotion transitions
        
        Args:
            duration_minutes: Total sequence duration
            sampling_rate_hz: Samples per second
            emotion_transitions: List of (emotion, duration_seconds) tuples
        """
        if emotion_transitions is None:
            # Default transition sequence
            emotion_transitions = [
                ('calm', 180),      # 3 minutes calm
                ('focused', 240),   # 4 minutes focused
                ('excited', 120),   # 2 minutes excited
                ('stressed', 60)    # 1 minute stressed
            ]
        
        total_samples = int(duration_minutes * 60 * sampling_rate_hz)
        samples = []
        current_time = datetime.now()
        sample_interval = timedelta(seconds=1/sampling_rate_hz)
        
        # Create timeline
        timeline = []
        for emotion, duration in emotion_transitions:
            timeline.extend([emotion] * int(duration * sampling_rate_hz))
        
        # Pad or trim to match total duration
        if len(timeline) < total_samples:
            timeline.extend([timeline[-1]] * (total_samples - len(timeline)))
        else:
            timeline = timeline[:total_samples]
        
        # Generate samples with smooth transitions
        previous_sample = None
        
        for i, emotion in enumerate(timeline):
            sample = self.generate_single_sample(emotion, add_noise=True)
            sample['timestamp'] = (current_time + i * sample_interval).isoformat()
            sample['sequence_index'] = i
            
            # Smooth transitions between emotions
            if previous_sample and previous_sample['emotion'] != emotion:
                sample = self._smooth_transition(previous_sample, sample, 0.3)
            
            samples.append(sample)
            previous_sample = sample
        
        return pd.DataFrame(samples)
    
    def _smooth_transition(self, prev_sample: Dict, curr_sample: Dict, 
                          smoothing: float = 0.3) -> Dict:
        """Smooth transition between emotion states"""
        smoothed = curr_sample.copy()
        
        biometric_features = ['heart_rate', 'hrv', 'skin_conductance', 'movement', 
                            'respiratory_rate', 'temperature']
        
        for feature in biometric_features:
            if feature in prev_sample and feature in curr_sample:
                prev_val = prev_sample[feature]
                curr_val = curr_sample[feature]
                # Linear interpolation
                smoothed[feature] = prev_val * smoothing + curr_val * (1 - smoothing)
                smoothed[feature] = round(smoothed[feature], 3)
        
        return smoothed
    
    def add_individual_differences(self, df: pd.DataFrame, 
                                 num_individuals: int = 50) -> pd.DataFrame:
        """Add individual baseline differences to simulate different people"""
        df_with_individuals = df.copy()
        df_with_individuals['individual_id'] = np.random.randint(0, num_individuals, len(df))
        
        # Generate individual baselines
        individual_baselines = {}
        for i in range(num_individuals):
            individual_baselines[i] = {
                'hr_baseline': np.random.normal(70, 10),  # Individual resting HR
                'hrv_baseline': np.random.normal(40, 8),   # Individual HRV baseline
                'gsr_baseline': np.random.normal(0.4, 0.1), # GSR sensitivity
                'age_factor': np.random.uniform(0.8, 1.2),  # Age-related factor
                'fitness_factor': np.random.uniform(0.8, 1.2) # Fitness factor
            }
        
        # Apply individual differences
        for idx, row in df_with_individuals.iterrows():
            individual_id = row['individual_id']
            baseline = individual_baselines[individual_id]
            
            # Adjust heart rate
            hr_adjustment = (baseline['hr_baseline'] - 70) * 0.5
            df_with_individuals.loc[idx, 'heart_rate'] += hr_adjustment
            
            # Adjust HRV
            hrv_adjustment = (baseline['hrv_baseline'] - 40) * 0.3
            df_with_individuals.loc[idx, 'hrv'] += hrv_adjustment
            
            # Apply age and fitness factors
            df_with_individuals.loc[idx, 'heart_rate'] *= baseline['age_factor']
            df_with_individuals.loc[idx, 'hrv'] *= baseline['fitness_factor']
        
        return df_with_individuals
    
    def create_comprehensive_dataset(self, 
                                   base_samples: int = 1000,
                                   temporal_sequences: int = 20,
                                   individuals: int = 100) -> Dict[str, pd.DataFrame]:
        """Create comprehensive training dataset with multiple components"""
        
        datasets = {}
        
        # 1. Balanced static dataset
        print("Creating balanced static dataset...")
        static_data = self.generate_balanced_dataset(base_samples, add_noise=True)
        static_data = self.add_individual_differences(static_data, individuals)
        datasets['static'] = static_data
        
        # 2. Temporal sequences
        print("Creating temporal sequences...")
        temporal_data = []
        for i in range(temporal_sequences):
            sequence = self.generate_temporal_sequence(duration_minutes=5)
            sequence['sequence_id'] = i
            temporal_data.append(sequence)
        
        datasets['temporal'] = pd.concat(temporal_data, ignore_index=True)
        
        # 3. Edge cases and stress tests
        print("Creating edge cases...")
        edge_cases = self._generate_edge_cases(500)
        datasets['edge_cases'] = edge_cases
        
        # 4. Validation set with known patterns
        print("Creating validation set...")
        validation_data = self._generate_validation_set(200)
        datasets['validation'] = validation_data
        
        return datasets
    
    def _generate_edge_cases(self, num_samples: int) -> pd.DataFrame:
        """Generate edge cases for robustness testing"""
        edge_samples = []
        
        for i in range(num_samples):
            # Random emotion
            emotion = np.random.choice(list(self.emotion_profiles.keys()))
            sample = self.generate_single_sample(emotion, add_noise=False)
            
            # Add extreme conditions
            if i % 5 == 0:  # High noise
                for feature in ['heart_rate', 'hrv', 'skin_conductance']:
                    noise = np.random.normal(0, sample[feature] * 0.1)
                    sample[feature] += noise
            
            elif i % 5 == 1:  # Boundary values
                sample['heart_rate'] = np.random.choice([45, 180])
                sample['hrv'] = np.random.choice([8, 90])
            
            elif i % 5 == 2:  # Inconsistent patterns
                # High HR with high HRV (unusual)
                sample['heart_rate'] = np.random.uniform(110, 130)
                sample['hrv'] = np.random.uniform(60, 80)
            
            sample['case_type'] = 'edge_case'
            edge_samples.append(sample)
        
        return pd.DataFrame(edge_samples)
    
    def _generate_validation_set(self, num_samples: int) -> pd.DataFrame:
        """Generate validation set with known expected outcomes"""
        validation_samples = []
        
        # Known patterns for each emotion
        known_patterns = {
            'calm': {'heart_rate': 65, 'hrv': 50, 'skin_conductance': 0.2, 'movement': 0.05},
            'stressed': {'heart_rate': 110, 'hrv': 15, 'skin_conductance': 0.8, 'movement': 0.4},
            'focused': {'heart_rate': 78, 'hrv': 45, 'skin_conductance': 0.35, 'movement': 0.03}
        }
        
        for emotion, pattern in known_patterns.items():
            for i in range(num_samples // len(known_patterns)):
                sample = pattern.copy()
                sample['emotion'] = emotion
                sample['emotion_label'] = self.emotion_profiles[emotion]['label']
                sample['timestamp'] = datetime.now().isoformat()
                sample['validation_type'] = 'known_pattern'
                
                # Add slight variations
                for feature in pattern.keys():
                    sample[feature] += np.random.normal(0, sample[feature] * 0.05)
                
                # Generate derived features
                sample.update(self._generate_derived_features(sample))
                validation_samples.append(sample)
        
        return pd.DataFrame(validation_samples)
    
    def export_datasets(self, datasets: Dict[str, pd.DataFrame], prefix: str = "emotionalchain"):
        """Export all datasets to files"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        for dataset_name, df in datasets.items():
            filename = f"{prefix}_{dataset_name}_{timestamp}.csv"
            filepath = self.output_dir / filename
            df.to_csv(filepath, index=False)
            print(f"Exported {len(df)} samples to {filepath}")
        
        # Export metadata
        metadata = {
            'generation_timestamp': datetime.now().isoformat(),
            'emotion_profiles': self.emotion_profiles,
            'datasets': {name: len(df) for name, df in datasets.items()},
            'total_samples': sum(len(df) for df in datasets.values()),
            'features': list(datasets['static'].columns) if 'static' in datasets else []
        }
        
        metadata_file = self.output_dir / f"{prefix}_metadata_{timestamp}.json"
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2, default=str)
        
        print(f"Metadata exported to {metadata_file}")
        return metadata
    
    def visualize_dataset(self, df: pd.DataFrame, save_plots: bool = True):
        """Create visualizations of the generated dataset"""
        plt.style.use('dark_background')  # Match EmotionalChain theme
        
        # 1. Emotion distribution
        plt.figure(figsize=(12, 8))
        
        plt.subplot(2, 3, 1)
        emotion_counts = df['emotion'].value_counts()
        colors = ['#00ff00', '#00cc00', '#ff6600', '#ff3300', '#ffff00', '#cc00ff']
        plt.pie(emotion_counts.values, labels=emotion_counts.index, autopct='%1.1f%%', 
                colors=colors[:len(emotion_counts)])
        plt.title('Emotion Distribution', color='white')
        
        # 2. Heart rate by emotion
        plt.subplot(2, 3, 2)
        for i, emotion in enumerate(df['emotion'].unique()):
            data = df[df['emotion'] == emotion]['heart_rate']
            plt.hist(data, alpha=0.7, label=emotion, color=colors[i], bins=20)
        plt.xlabel('Heart Rate (BPM)', color='white')
        plt.ylabel('Frequency', color='white')
        plt.title('Heart Rate Distribution by Emotion', color='white')
        plt.legend()
        
        # 3. HRV by emotion
        plt.subplot(2, 3, 3)
        df.boxplot(column='hrv', by='emotion', ax=plt.gca())
        plt.title('HRV by Emotion', color='white')
        plt.ylabel('HRV (ms)', color='white')
        
        # 4. Skin conductance vs heart rate
        plt.subplot(2, 3, 4)
        for i, emotion in enumerate(df['emotion'].unique()):
            emotion_data = df[df['emotion'] == emotion]
            plt.scatter(emotion_data['heart_rate'], emotion_data['skin_conductance'], 
                       alpha=0.6, label=emotion, color=colors[i])
        plt.xlabel('Heart Rate (BPM)', color='white')
        plt.ylabel('Skin Conductance', color='white')
        plt.title('Skin Conductance vs Heart Rate', color='white')
        plt.legend()
        
        # 5. Movement vs emotion
        plt.subplot(2, 3, 5)
        df.boxplot(column='movement', by='emotion', ax=plt.gca())
        plt.title('Movement by Emotion', color='white')
        plt.ylabel('Movement Level', color='white')
        
        # 6. Correlation heatmap
        plt.subplot(2, 3, 6)
        numeric_cols = ['heart_rate', 'hrv', 'skin_conductance', 'movement', 'temperature']
        corr_matrix = df[numeric_cols].corr()
        sns.heatmap(corr_matrix, annot=True, cmap='RdYlBu_r', center=0,
                   square=True, fmt='.2f')
        plt.title('Feature Correlations', color='white')
        
        plt.tight_layout()
        
        if save_plots:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            plot_file = self.output_dir / f"dataset_visualization_{timestamp}.png"
            plt.savefig(plot_file, dpi=300, bbox_inches='tight', 
                       facecolor='black', edgecolor='none')
            print(f"Visualization saved to {plot_file}")
        
        plt.show()
    
    def generate_consensus_scenarios(self, num_scenarios: int = 100) -> pd.DataFrame:
        """Generate specific scenarios for consensus testing"""
        scenarios = []
        
        scenario_types = [
            'unanimous_calm',      # All validators calm
            'unanimous_stressed',  # All validators stressed
            'mixed_emotions',      # Mix of different emotions
            'high_stress_outlier', # One very stressed validator
            'low_quality_data',    # Some validators with poor data quality
            'temporal_shift'       # Emotions changing over time
        ]
        
        for i in range(num_scenarios):
            scenario_type = np.random.choice(scenario_types)
            num_validators = np.random.randint(3, 8)  # 3-7 validators
            
            scenario_data = {
                'scenario_id': i,
                'scenario_type': scenario_type,
                'num_validators': num_validators,
                'validators': []
            }
            
            if scenario_type == 'unanimous_calm':
                emotion = 'calm'
                for v in range(num_validators):
                    validator_data = self.generate_single_sample(emotion)
                    validator_data['validator_id'] = f"val_{v}"
                    scenario_data['validators'].append(validator_data)
            
            elif scenario_type == 'unanimous_stressed':
                emotion = 'stressed'
                for v in range(num_validators):
                    validator_data = self.generate_single_sample(emotion)
                    validator_data['validator_id'] = f"val_{v}"
                    scenario_data['validators'].append(validator_data)
            
            elif scenario_type == 'mixed_emotions':
                emotions = np.random.choice(list(self.emotion_profiles.keys()), 
                                          num_validators, replace=True)
                for v, emotion in enumerate(emotions):
                    validator_data = self.generate_single_sample(emotion)
                    validator_data['validator_id'] = f"val_{v}"
                    scenario_data['validators'].append(validator_data)
            
            elif scenario_type == 'high_stress_outlier':
                # Most validators calm, one very stressed
                for v in range(num_validators):
                    if v == 0:  # Outlier
                        validator_data = self.generate_single_sample('stressed')
                        # Make it extra stressful
                        validator_data['heart_rate'] = min(140, validator_data['heart_rate'] * 1.3)
                        validator_data['skin_conductance'] = min(0.95, validator_data['skin_conductance'] * 1.2)
                    else:
                        validator_data = self.generate_single_sample('calm')
                    
                    validator_data['validator_id'] = f"val_{v}"
                    scenario_data['validators'].append(validator_data)
            
            elif scenario_type == 'low_quality_data':
                # Some validators have poor quality data
                for v in range(num_validators):
                    emotion = np.random.choice(list(self.emotion_profiles.keys()))
                    validator_data = self.generate_single_sample(emotion)
                    
                    if v < num_validators // 2:  # Half have poor quality
                        # Add unrealistic values
                        validator_data['heart_rate'] = np.random.choice([30, 220])  # Impossible values
                        validator_data['data_quality'] = 0.3
                    else:
                        validator_data['data_quality'] = 0.9
                    
                    validator_data['validator_id'] = f"val_{v}"
                    scenario_data['validators'].append(validator_data)
            
            # Calculate expected consensus outcome
            scenario_data['expected_consensus'] = self._calculate_expected_consensus(scenario_data)
            scenarios.append(scenario_data)
        
        return pd.DataFrame(scenarios)
    
    def _calculate_expected_consensus(self, scenario: Dict) -> Dict:
        """Calculate expected consensus outcome for a scenario"""
        validators = scenario['validators']
        
        if not validators:
            return {'consensus_reached': False, 'confidence': 0}
        
        # Simple consensus calculation for ground truth
        total_stress = sum(v.get('stress_level', 50) for v in validators)
        avg_stress = total_stress / len(validators)
        
        total_quality = sum(v.get('data_quality', 0.8) for v in validators)
        avg_quality = total_quality / len(validators)
        
        # Consensus criteria
        consensus_reached = (
            len(validators) >= 3 and  # Minimum validators
            avg_quality > 0.6 and    # Minimum quality
            avg_stress < 70           # Not too stressed on average
        )
        
        confidence = avg_quality * (1 - avg_stress / 100)
        
        return {
            'consensus_reached': consensus_reached,
            'confidence': confidence,
            'avg_stress': avg_stress,
            'avg_quality': avg_quality,
            'num_validators': len(validators)
        }

# Example usage and testing
if __name__ == "__main__":
    # Initialize generator
    generator = EmotionalDataGenerator("training_data")
    
    print("🧠 EmotionalChain Training Data Generator")
    print("=" * 50)
    
    # Generate comprehensive dataset
    print("\n1. Generating comprehensive dataset...")
    datasets = generator.create_comprehensive_dataset(
        base_samples=500,      # 500 samples per emotion (3000 total)
        temporal_sequences=10, # 10 temporal sequences
        individuals=50         # 50 different individuals
    )
    
    # Export datasets
    print("\n2. Exporting datasets...")
    metadata = generator.export_datasets(datasets)
    
    # Visualize main dataset
    print("\n3. Creating visualizations...")
    generator.visualize_dataset(datasets['static'])
    
    # Generate consensus scenarios
    print("\n4. Generating consensus scenarios...")
    consensus_scenarios = generator.generate_consensus_scenarios(50)
    scenario_file = generator.output_dir / "consensus_scenarios.json"
    consensus_scenarios.to_json(scenario_file, orient='records', indent=2)
    print(f"Consensus scenarios saved to {scenario_file}")
    
    # Print summary
    print("\n5. Dataset Summary:")
    print(f"Total samples generated: {metadata['total_samples']}")
    for dataset_name, count in metadata['datasets'].items():
        print(f"  - {dataset_name}: {count} samples")
    
    print(f"\nFeatures per sample: {len(metadata['features'])}")
    print("Main features:", metadata['features'][:10])
    
    print(f"\nOutput directory: {generator.output_dir}")
    print("\n✅ Training data generation complete!")
    print("\nNext steps:")
    print("1. Train ML models using emotion_classifier.py")
    print("2. Validate models on the generated validation set")
    print("3. Test consensus scenarios with trained models")