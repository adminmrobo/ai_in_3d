# 3D로 설명하는 AI

AI의 원리를 3D 판 위에 올려, 돌려 보고 값을 바꿔 보며 읽는 해설 시리즈입니다.

- 사이트: https://adminmrobo.github.io/ai_in_3d/
- 글 · 안상선 ((주)M-Robo 대표)

## 편 목록

| 번호 | 제목 | 폴더 | 상태 |
|---|---|---|---|
| 01 | AI 뒤에 있는 수학 | [`math_behind_ai/`](math_behind_ai/) | 공개 |
| 02 | 미니배치 경사하강 | `minibatch_gd/` | 준비 중 |
| 03 | 곡면의 기울기 | `surface_gradient/` | 준비 중 |

## 폴더 구조

```
.
├─ index.html          시리즈 첫 화면 (편별 카드)
├─ math_behind_ai/     01편
├─ chars3d/lab3d.js    연구실 식구 3D 모델 (fruitfly-lab-expressions 사본, 모든 편이 같이 씀)
└─ assets/             얼굴 그림, 편별 표지
```

- 3D는 three.js 0.170을 CDN에서 불러옵니다.
- `chars3d/lab3d.js`의 원본은 [fruitfly-lab-expressions](https://github.com/adminmrobo/fruitfly-lab-expressions)입니다. 원본을 고치면 이 사본도 바꿉니다.
- 새 편은 폴더를 하나 만들고, 공용 파일은 `../chars3d/`, `../assets/`로 불러옵니다. 첫 화면 카드와 위 표에 한 줄씩 더합니다.

## 01편 참고

구성은 인포그래픽 「Mathematics Behind AI」(ML Tut)를 참고했습니다. 3D 장면과 설명문은 새로 만들었습니다. 화면의 수치는 개념 설명용 예시입니다.

## 저작권

캐릭터 이름·설정 © 안상선. 그림·모델은 저작권자의 허락 없이 쓸 수 없습니다.
