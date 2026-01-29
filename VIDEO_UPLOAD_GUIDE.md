# Функционал загрузки видео для CMS

## Обзор

Реализован полный функционал для загрузки, управления и отображения видео на основном сайте через CMS. Видео загружаются в Cloudinary и сохраняются в БД.

## Реализованные компоненты

### 1. **Prisma Schema** (`prisma/schema.prisma`)
- Добавлены поля в модель `MainPageSection`:
  - `videoUrl`: URL видео на Cloudinary
  - `videoPublicId`: Public ID в Cloudinary (для удаления)

### 2. **API Endpoints**

#### `/api/upload/video` (POST/DELETE)
- **POST**: загружает видео на Cloudinary
  - Параметры: `file` (видео файл), `sectionId` (ID секции)
  - Лимит размера: 100MB
  - Поддерживаемые форматы: mp4, webm, mov, avi, mkv, flv, wmv, m4v
  - Возвращает: URL видео, publicId, длительность

- **DELETE**: удаляет видео с Cloudinary
  - Параметры: `public_id` (query parameter)

#### `/api/translate/main-page/video` (POST/DELETE)
- **POST**: сохраняет информацию видео в БД
  - Тело запроса: `{ sectionId, videoUrl, videoPublicId }`
  - Автоматически удаляет старое видео из Cloudinary при перезаписи

- **DELETE**: удаляет видео из БД и Cloudinary
  - Тело запроса: `{ sectionId }`

#### `/api/public/main-page` (GET)
- Обновлён для включения `videoUrl` для hero и partners секций
- Параметр: `locale` (uk или en)

### 3. **UI Компоненты**

#### `VideoUpload.tsx`
Компонент для загрузки видео с функциями:
- Drag & drop загрузка
- Клик для выбора файла
- Отображение загруженного видео
- Удаление видео
- Прогресс индикатор при загрузке
- Валидация размера и типа файла

#### `MainPageVideoManager.tsx`
Контейнер для управления видео для:
- Hero секції (видео без звука)
- Partners секції (видео со звуком)

Функции:
- Загрузка видео в Cloudinary
- Сохранение URL в БД
- Удаление видео

### 4. **Обновлённая страница**

`src/app/(protected)/translate/main/page.tsx`
- Добавлена компонента `MainPageVideoManager`
- Отображается рядом с `View` компонентом для управления секціями

## Миграция БД

Созданя миграция `20260129151922_add_video_support_to_main_page_sections` которая добавляет поля видео в таблицу `MainPageSection`.

```bash
pnpm prisma migrate dev --name add_video_support_to_main_page_sections
```

## Использование на основному сайті

### Получение видео

```javascript
// Fetch main page sections с видео
const response = await fetch('/api/public/main-page?locale=uk');
const data = await response.json();

// Структура ответа
{
  sections: [
    {
      key: 'hero',
      position: 0,
      items: { /* переклади */ },
      videoUrl: 'https://res.cloudinary.com/...' // видео для hero
    },
    {
      key: 'partners',
      position: 4,
      items: { /* переклади */ },
      videoUrl: 'https://res.cloudinary.com/...' // видео для partners
    }
  ],
  locale: 'uk'
}
```

### Використання видео в компонентах

```jsx
// Hero секція (без звука)
{section.videoUrl && (
  <video 
    src={section.videoUrl}
    muted
    autoPlay
    loop
    playsInline
    className="absolute inset-0 h-full w-full object-cover"
  />
)}

// Partners секція (зі звуком)
{section.videoUrl && (
  <video 
    src={section.videoUrl}
    controls
    playsInline
    className="w-full h-auto rounded-lg"
  />
)}
```

## Особливості реалізації

1. **Автоматичне управління Cloudinary**
   - При перезагруженні видео старе автоматично видаляється
   - При видаленні из БД видео видаляється з Cloudinary

2. **Гнучка конфігурація**
   - Можна легко додати видео для інших секцій
   - Поля розширювані без змін БД

3. **Сумісність з існуючим кодом**
   - Використовує ті ж паттерни що й загрузка фото
   - Сумісна с існуючими API

4. **Оптимізація**
   - Максимальний розмір видео: 100MB
   - Підтримує всі основні відео формати

## Файли проекту

- [/prisma/schema.prisma](prisma/schema.prisma) - Оновлена схема з полями видео
- [/src/app/api/upload/video/route.ts](src/app/api/upload/video/route.ts) - API для загрузки
- [/src/app/api/translate/main-page/video/route.ts](src/app/api/translate/main-page/video/route.ts) - API для збереження в БД
- [/src/app/api/public/main-page/route.ts](src/app/api/public/main-page/route.ts) - Оновлений public API
- [/src/app/(protected)/translate/main/_components/VideoUpload.tsx](src/app/(protected)/translate/main/_components/VideoUpload.tsx) - Компонента для загрузки
- [/src/app/(protected)/translate/main/_components/MainPageVideoManager.tsx](src/app/(protected)/translate/main/_components/MainPageVideoManager.tsx) - Менеджер видео
- [/src/app/(protected)/translate/main/page.tsx](src/app/(protected)/translate/main/page.tsx) - Оновлена сторінка CMS
- [/src/lib/cloudinary-publicid.ts](src/lib/cloudinary-publicid.ts) - Оновлена функція для підтримки видео форматів

## Тестування

1. Перейти на сторінку `/translate/main` в CMS
2. Побачити нову панель "Відео" з двома полями:
   - "Відео головної (без звука)" - для hero секції
   - "Відео Партнерів" - для partners секції
3. Завантажити відеофайл (mp4, webm, mov, etc.)
4. Відео автоматично загружається в Cloudinary і зберігається посилання в БД
5. На основному сайті відео буде доступне через `/api/public/main-page?locale=uk`

## Вирішені проблеми

✅ Функціональність загрузки видео на CMS
✅ Збереження видео в Cloudinary
✅ Зберігання посилання в БД
✅ UI сумісний з існуючим стилем
✅ Fetch видео на основному сайті
✅ Управління видео (видалення, переавантаження)
✅ Підтримка декількох відео (hero и partners)
