import os
import urllib.request
import numpy as np
import cv2
import mediapipe as mp
from mediapipe.tasks.python import vision
from mediapipe.tasks import python

class MediaPipeFaceDetector:
    def __init__(self, model_path: str, model_url: str, min_confidence: float = 0.5):
        if not os.path.exists(model_path):
            urllib.request.urlretrieve(model_url, model_path)

        base_options = python.BaseOptions(model_asset_path=model_path)

        options = vision.FaceDetectorOptions(
            base_options=base_options,
            min_detection_confidence=min_confidence,
        )

        self.detector = vision.FaceDetector.create_from_options(options)


    def decode_frame(self, frame: bytes) -> np.ndarray:
        """Decode JPEG bytes -> OpenCV BGR"""
        np_arr = np.frombuffer(frame, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img

    def encode_frame(self, img: np.ndarray) -> bytes:
        """OpenCV BGR -> JPEG bytes"""
        _, buffer = cv2.imencode(".jpg", img, [int(cv2.IMWRITE_JPEG_QUALITY), 95])
        return buffer.tobytes()


    def get_faces(self, img: np.ndarray) -> list:
        rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb
        )

        result = self.detector.detect(mp_image)

        if not result.detections:
            return []

        faces = []
        for det in result.detections:
            bb = det.bounding_box

            faces.append({
                "box": (
                    int(bb.origin_x),
                    int(bb.origin_y),
                    int(bb.width),
                    int(bb.height),
                ),
                "confidence": float(det.categories[0].score),
            })

        return faces
    
    def draw_faces(self, img: np.ndarray, faces: list) -> np.ndarray:
        for face in faces:
            x, y, w, h = face["box"]
            conf = face["confidence"]

            # rectangle
            cv2.rectangle(
                img,
                (x, y),
                (x + w, y + h),
                (0, 255, 0),
                2
            )

            # label background (optional nhưng đẹp hơn)
            label = f"{conf:.2f}"

            (text_w, text_h), _ = cv2.getTextSize(
                label,
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                1
            )

            cv2.rectangle(
                img,
                (x, y - text_h - 6),
                (x + text_w + 4, y),
                (0, 255, 0),
                -1
            )

            cv2.putText(
                img,
                label,
                (x + 2, y - 4),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5,
                (0, 0, 0),
                1,
                cv2.LINE_AA
            )

        return img

    def crop_face(
        self,
        img: np.ndarray,
        box,
        padding: float = 0.2,
        target_size=(112, 112)
    ) -> np.ndarray:

        x, y, w, h = box
        H, W = img.shape[:2]

        pad_w = int(w * padding)
        pad_h = int(h * padding)

        x1 = max(0, x - pad_w)
        y1 = max(0, y - pad_h)
        x2 = min(W, x + w + pad_w)
        y2 = min(H, y + h + pad_h)

        face = img[y1:y2, x1:x2]

        if face.size == 0:
            return None

        face = cv2.resize(face, target_size, interpolation=cv2.INTER_AREA)

        return face

    def draw_face_with_label(self, img: np.ndarray, box, label: str) -> np.ndarray:
        x, y, w, h = box

        cv2.rectangle(
            img,
            (x, y),
            (x + w, y + h),
            (0, 255, 0),
            2
        )

        cv2.putText(
            img,
            label,
            (x, max(20, y - 10)),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.6,
            (0, 255, 0),
            2,
            cv2.LINE_AA
        )

        return img