import cv2
import numpy as np
import tensorflow as tf
from tensorflow import keras
import json
import os

class ImprovedEmotionDetector:
    def __init__(self):
        self.emotion_labels = ['Angry', 'Disgust', 'Fear', 'Happy', 'Sad', 'Surprise', 'Neutral']
        self.model = None
        self.load_model()
        
        # Cache ultra-agressivo para otimização
        self.prediction_cache = {}
        self.cache_size = 0
        self.max_cache_size = 200  # Cache maior para mais hits
        
    def load_model(self):
        """Carrega o modelo melhorado de detecção de emoções"""
        try:
            if os.path.exists("better_emotion_model.json") and os.path.exists("better_emotion_model.weights.h5"):
                print("Carregando modelo melhorado...")
                
                with open("better_emotion_model.json", 'r') as json_file:
                    model_json = json_file.read()
                
                self.model = keras.models.model_from_json(model_json)
                self.model.load_weights("better_emotion_model.weights.h5")
                
                print("✅ Modelo melhorado carregado!")
                
            else:
                print("Criando modelo melhorado...")
                self.model = self._create_improved_model()
                self._save_model()
                
        except Exception as e:
            print(f"Erro ao carregar modelo: {e}")
            self.model = self._create_improved_model()
    
    def _create_improved_model(self):
        """Cria um modelo melhorado baseado em características faciais"""
        from keras.models import Sequential
        from keras.layers import Dense, Dropout, Flatten, Conv2D, MaxPooling2D, BatchNormalization
        
        model = Sequential([
            # Primeira camada - detecta bordas básicas
            Conv2D(32, (3, 3), activation='relu', input_shape=(48, 48, 1)),
            BatchNormalization(),
            Conv2D(32, (3, 3), activation='relu'),
            MaxPooling2D(pool_size=(2, 2)),
            Dropout(0.25),
            
            # Segunda camada - detecta características faciais
            Conv2D(64, (3, 3), activation='relu'),
            BatchNormalization(),
            Conv2D(64, (3, 3), activation='relu'),
            MaxPooling2D(pool_size=(2, 2)),
            Dropout(0.25),
            
            # Terceira camada - detecta padrões complexos
            Conv2D(128, (3, 3), activation='relu'),
            BatchNormalization(),
            Dropout(0.25),
            
            # Camadas densas para classificação
            Flatten(),
            Dense(512, activation='relu'),
            BatchNormalization(),
            Dropout(0.5),
            Dense(256, activation='relu'),
            Dropout(0.5),
            Dense(7, activation='softmax')
        ])
        
        model.compile(
            optimizer='adam',
            loss='categorical_crossentropy',
            metrics=['accuracy']
        )
        
        return model
    
    def _save_model(self):
        """Salva o modelo criado"""
        try:
            model_json = self.model.to_json()
            with open("better_emotion_model.json", "w") as json_file:
                json_file.write(model_json)
            
            self.model.save_weights("better_emotion_model.weights.h5")
            print("Modelo salvo com sucesso!")
        except Exception as e:
            print(f"Erro ao salvar modelo: {e}")
    
    def preprocess_face(self, face_image):
        """Preprocessa a imagem do rosto para máxima velocidade"""
        try:
            # Se já é 48x48, pular redimensionamento
            if face_image.shape[:2] != (48, 48):
                face_resized = cv2.resize(face_image, (48, 48), interpolation=cv2.INTER_LINEAR)
            else:
                face_resized = face_image
            
            # Converter para escala de cinza de forma mais rápida
            if len(face_resized.shape) == 3:
                face_gray = cv2.cvtColor(face_resized, cv2.COLOR_BGR2GRAY)
            else:
                face_gray = face_resized
            
            # CLAHE simplificado para velocidade
            clahe = cv2.createCLAHE(clipLimit=1.5, tileGridSize=(4,4))  # Configurações mais rápidas
            face_enhanced = clahe.apply(face_gray)
            
            # Normalizar rapidamente
            face_normalized = face_enhanced * (1.0/255.0)  # Multiplicação mais rápida que divisão
            
            # Expandir dimensões
            face_input = face_normalized[np.newaxis, :, :, np.newaxis]
            
            return face_input
            
        except Exception as e:
            print(f"Erro no preprocessamento: {e}")
            return None
    
    def predict_emotion_with_rules(self, face_image):
        """Prediz emoção usando modelo + regras heurísticas com cache agressivo"""
        try:
            face_input = self.preprocess_face(face_image)
            if face_input is None:
                return "Neutral", 0.5
            
            # Cache ultra-rápido baseado apenas nas dimensões da imagem
            face_hash = hash(face_image.tobytes()[::10])  # Sample menor do hash para velocidade
            
            # Verificar cache primeiro
            if face_hash in self.prediction_cache:
                return self.prediction_cache[face_hash]
            
            # Predição do modelo
            if self.model is not None:
                predictions = self.model.predict(face_input, verbose=0)
                emotion_probs = predictions[0]
            else:
                # Fallback super rápido
                emotion_probs = np.array([0.1, 0.1, 0.1, 0.4, 0.1, 0.1, 0.1])  # Default para Happy
            
            # Aplicar regras simplificadas para velocidade
            adjusted_probs = self._apply_emotion_rules_fast(face_image, emotion_probs)
            
            # Obter emoção final
            emotion_index = np.argmax(adjusted_probs)
            confidence = np.max(adjusted_probs)
            emotion = self.emotion_labels[emotion_index]
            
            # Adicionar ao cache agressivo
            result = (emotion, float(confidence))
            if self.cache_size < self.max_cache_size:
                self.prediction_cache[face_hash] = result
                self.cache_size += 1
            elif len(self.prediction_cache) > self.max_cache_size:
                # Limpar cache quando muito cheio
                self.prediction_cache.clear()
                self.cache_size = 0
            
            return result
            
        except Exception as e:
            print(f"Erro na predição: {e}")
            return "Neutral", 0.5
    
    def _analyze_facial_features(self, face_image):
        """Análise baseada em características faciais básicas"""
        try:
            # Converter para escala de cinza
            if len(face_image.shape) == 3:
                gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            else:
                gray = face_image
            
            h, w = gray.shape
            
            # Dividir rosto em regiões
            top_region = gray[0:h//3, :]  # Testa
            middle_region = gray[h//3:2*h//3, :]  # Olhos
            bottom_region = gray[2*h//3:h, :]  # Boca
            
            # Calcular estatísticas
            top_mean = np.mean(top_region)
            middle_mean = np.mean(middle_region)
            bottom_mean = np.mean(bottom_region)
            
            overall_mean = np.mean(gray)
            overall_std = np.std(gray)
            
            # Detectar bordas (indicativo de expressões)
            edges = cv2.Canny(gray, 50, 150)
            edge_density = np.sum(edges > 0) / (h * w)
            
            # Inicializar probabilidades base
            emotion_probs = np.array([0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16])  # Slight bias to neutral
            
            # Regras heurísticas baseadas em características
            
            # Happy: região da boca mais clara (sorriso)
            if bottom_mean > overall_mean * 1.1:
                emotion_probs[3] += 0.3  # Happy
            
            # Sad: região da boca mais escura
            if bottom_mean < overall_mean * 0.9:
                emotion_probs[4] += 0.2  # Sad
            
            # Angry: alta densidade de bordas, contraste alto
            if edge_density > 0.05 and overall_std > 30:
                emotion_probs[0] += 0.25  # Angry
            
            # Surprise: alta variação na região dos olhos
            middle_std = np.std(middle_region)
            if middle_std > overall_std * 1.2:
                emotion_probs[5] += 0.2  # Surprise
            
            # Fear: similar a surprise mas com menos intensidade
            if middle_std > overall_std * 1.1 and overall_mean < 120:
                emotion_probs[2] += 0.15  # Fear
            
            # Disgust: assimetria na região da boca
            left_bottom = bottom_region[:, :w//2]
            right_bottom = bottom_region[:, w//2:]
            if abs(np.mean(left_bottom) - np.mean(right_bottom)) > 10:
                emotion_probs[1] += 0.15  # Disgust
            
            # Normalizar probabilidades
            emotion_probs = emotion_probs / np.sum(emotion_probs)
            
            return emotion_probs
            
        except Exception as e:
            print(f"Erro na análise de características: {e}")
            # Retornar distribuição uniforme
            return np.array([0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16])
    
    def _apply_emotion_rules_fast(self, face_image, model_probs):
        """Versão ultra-rápida das regras de emoção"""
        try:
            # Análise simplificada e rápida
            if len(face_image.shape) == 3:
                gray = cv2.cvtColor(face_image, cv2.COLOR_BGR2GRAY)
            else:
                gray = face_image
            
            h, w = gray.shape
            
            # Análise rápida de regiões principais
            overall_mean = np.mean(gray)
            bottom_mean = np.mean(gray[h//2:, :])  # Região da boca
            
            # Ajustes rápidos baseados em heurísticas simples
            adjusted_probs = model_probs.copy()
            
            # Happy: boca mais clara
            if bottom_mean > overall_mean * 1.05:
                adjusted_probs[3] *= 1.2  # Happy boost
            
            # Sad: boca mais escura
            if bottom_mean < overall_mean * 0.95:
                adjusted_probs[4] *= 1.15  # Sad boost
            
            # Normalizar
            adjusted_probs = adjusted_probs / np.sum(adjusted_probs)
            
            return adjusted_probs
            
        except Exception as e:
            return model_probs
    
    def _apply_emotion_rules(self, face_image, model_probs):
        """Aplica regras para ajustar as probabilidades do modelo"""
        try:
            # Obter análise baseada em características
            feature_probs = self._analyze_facial_features(face_image)
            
            # Combinar predições do modelo com análise de características
            # 70% modelo, 30% características
            combined_probs = 0.7 * model_probs + 0.3 * feature_probs
            
            # Aplicar suavização para evitar predições muito extremas
            smoothed_probs = combined_probs * 0.8 + 0.2 * np.array([0.14, 0.14, 0.14, 0.14, 0.14, 0.14, 0.16])
            
            return smoothed_probs
            
        except Exception as e:
            print(f"Erro na aplicação de regras: {e}")
            return model_probs
    
    def get_emotion_color(self, emotion):
        """Retorna a cor BGR correspondente à emoção"""
        emotion_colors = {
            'Happy': (0, 255, 0),      # Verde
            'Sad': (255, 0, 0),        # Azul
            'Angry': (0, 0, 255),      # Vermelho
            'Fear': (255, 0, 255),     # Magenta
            'Surprise': (0, 255, 255), # Amarelo
            'Disgust': (128, 0, 128),  # Roxo
            'Neutral': (255, 255, 255) # Branco
        }
        return emotion_colors.get(emotion, (255, 255, 255))
    
    def clear_cache(self):
        """Limpa o cache de predições"""
        self.prediction_cache.clear()
        self.cache_size = 0
