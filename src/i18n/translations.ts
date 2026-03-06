export type Language = 'en' | 'pt' | 'de' | 'es';

export interface Translations {
  // Common
  cancel: string;
  save: string;
  untitledRecipe: string;

  // Tab bar
  tabHome: string;
  tabFavorites: string;
  tabExchange: string;
  tabProfile: string;

  // List sections
  sectionDrafts: string;
  sectionPublished: string;

  // Empty state
  emptyTitle: string;
  emptySub: string;

  // Ingredient count
  ingredient: string;
  ingredients: string;

  // Profile modal
  profileTitle: string;
  profileNameSub: string;
  profileNamePlaceholder: string;
  profileLanguageLabel: string;

  // View card modal
  viewCardTitle: string;
  viewCardSub: string;
  viewCardPlaceholder: string;
  viewCardBtn: string;

  // QR Scanner
  qrCameraTitle: string;
  qrCameraSub: string;
  qrCameraSettings: string;
  qrAllowCamera: string;
  qrScanTitle: string;
  qrAlignHint: string;
  qrEnterManually: string;
  qrInvalidTitle: string;
  qrInvalidBody: string;

  // Coming soon
  comingSoonTitle: string;
  comingSoonBody: string;

  // Form
  formBack: string;
  formNewRecipe: string;
  formTitlePlaceholder: string;
  formAddPhoto: string;
  formServes: string;
  formPrep: string;
  formCook: string;
  formIngredients: string;
  formDirections: string;
  formAddIngredient: string;
  formAddStep: string;
  formPublish: string;
  formPreviewCard: string;
  formSaveDraft: string;
  formDraftSaved: string;
  formIngredientPrefix: string;
  formStepPrefix: string;

  // Voice
  voiceTapToRecord: string;
  voiceMicNeeded: string;
  voiceTranscribing: string;
  voiceStop: string;
  voiceReRecord: string;
  voiceRecordingDonePrefix: string;
  voiceMicPermTitle: string;
  voiceMicPermBody: string;
  voiceNoSpeechTitle: string;
  voiceNoSpeechBody: string;
  voiceFillFailedTitle: string;

  // Publish confirm
  publishConfirmHeadline: string;
  publishConfirmBody: string;
  publishConfirmBtn: string;
  publishConfirmCancel: string;

  // Preview screen
  previewBack: string;
  previewEditRecipe: string;

  // Delete modal
  deleteDraftTitle: string;
  deleteCardTitle: string;
  deleteDraftBody: (title: string) => string;
  deleteCardBody: string;
  deleteDraftBtn: string;
  deleteCardBtn: string;

  // Photo picker
  photoPickerTitle: string;
  photoPickerSub: string;
  photoTakePhoto: string;
  photoChooseLibrary: string;

  // CardView screen
  cardViewBack: string;
  cardViewRecipeBy: string;
  cardViewNotFound: string;

  // Receive screen
  receiveBack: string;
  receiveLoading: string;
  receiveNotFoundTitle: string;
  receiveNotFoundBody: string;
  receiveBackHome: string;
  receiveSharedBy: string;
  receiveAddBtn: string;
  receiveSaving: string;
  receiveAdded: string;

  // Cloud / publish alerts
  cloudSyncFailedTitle: string;
  publishFailedTitle: string;
  somethingWentWrong: string;
}

// ─── English ──────────────────────────────────────────────────────────────────

const en: Translations = {
  cancel: 'Cancel',
  save: 'Save',
  untitledRecipe: 'Untitled Recipe',

  tabHome: 'Home',
  tabFavorites: 'Favorites',
  tabExchange: 'Exchange',
  tabProfile: 'Profile',

  sectionDrafts: 'YOUR DRAFTS',
  sectionPublished: 'PUBLISHED',

  emptyTitle: 'No recipes yet',
  emptySub: 'Tap New Recipe to get started.',

  ingredient: 'ingredient',
  ingredients: 'ingredients',

  profileTitle: 'Profile',
  profileNameSub: 'This name will appear on your recipe cards.',
  profileNamePlaceholder: 'Enter your name',
  profileLanguageLabel: 'Language',

  viewCardTitle: 'View Shared Card',
  viewCardSub: 'Paste the card ID from a shared recipe link.',
  viewCardPlaceholder: 'Paste card ID here',
  viewCardBtn: 'View Recipe',

  qrCameraTitle: 'Camera Access Needed',
  qrCameraSub: 'Grant camera access to scan recipe QR codes.',
  qrCameraSettings: 'Please enable camera in your device Settings.',
  qrAllowCamera: 'Allow Camera',
  qrScanTitle: 'Scan Recipe Card',
  qrAlignHint: 'Align the QR code within the frame',
  qrEnterManually: 'Enter code manually',
  qrInvalidTitle: 'Invalid QR Code',
  qrInvalidBody: "This doesn't look like a RecipeCards QR code.",

  comingSoonTitle: 'Coming Soon',
  comingSoonBody: 'Favorites will be available in a future update.',

  formBack: '← Home',
  formNewRecipe: 'NEW RECIPE',
  formTitlePlaceholder: 'Recipe title',
  formAddPhoto: 'Add Photo',
  formServes: 'SERVES',
  formPrep: 'PREP',
  formCook: 'COOK',
  formIngredients: 'INGREDIENTS',
  formDirections: 'DIRECTIONS',
  formAddIngredient: '+ Add ingredient',
  formAddStep: '+ Add step',
  formPublish: 'Publish',
  formPreviewCard: 'Preview Card',
  formSaveDraft: 'Save draft',
  formDraftSaved: '✓  Draft saved',
  formIngredientPrefix: 'Ingredient',
  formStepPrefix: 'Step',

  voiceTapToRecord: 'Tap to record your recipe',
  voiceMicNeeded: 'Microphone permission needed',
  voiceTranscribing: 'Transcribing & analysing…',
  voiceStop: 'Stop',
  voiceReRecord: 'Re-record',
  voiceRecordingDonePrefix: 'Recording done',
  voiceMicPermTitle: 'Microphone Permission',
  voiceMicPermBody: 'Please allow microphone access to record recipes.',
  voiceNoSpeechTitle: 'No speech detected',
  voiceNoSpeechBody: 'Please try recording again and speak clearly.',
  voiceFillFailedTitle: 'Voice fill failed',

  publishConfirmHeadline: 'Ready to publish?',
  publishConfirmBody: 'Once published, this card is permanent. No edits, no take-backs. This is your recipe, exactly as it is right now.',
  publishConfirmBtn: 'Publish forever',
  publishConfirmCancel: 'Not yet',

  previewBack: '← Back',
  previewEditRecipe: '← Edit Recipe',

  deleteDraftTitle: 'Delete Draft?',
  deleteCardTitle: 'Remove Card?',
  deleteDraftBody: (title) => `"${title}" will be permanently deleted. This cannot be undone.`,
  deleteCardBody: "Everyone you shared it with will keep their copy, but they won't be able to re-share the card.",
  deleteDraftBtn: 'Delete forever',
  deleteCardBtn: 'Remove card',

  photoPickerTitle: 'Add Photo',
  photoPickerSub: 'How would you like to add a photo?',
  photoTakePhoto: 'Take Photo',
  photoChooseLibrary: 'Choose from Library',

  cardViewBack: '← Home',
  cardViewRecipeBy: 'Recipe by',
  cardViewNotFound: 'Recipe not found.',

  receiveBack: '← Back',
  receiveLoading: 'Loading recipe…',
  receiveNotFoundTitle: 'Recipe not found',
  receiveNotFoundBody: 'This recipe could not be found or is no longer available.',
  receiveBackHome: 'Back to Home',
  receiveSharedBy: 'Shared by',
  receiveAddBtn: 'Add to My Collection',
  receiveSaving: 'Saving…',
  receiveAdded: 'Added to collection!',

  cloudSyncFailedTitle: 'Cloud sync failed',
  publishFailedTitle: 'Publish failed',
  somethingWentWrong: 'Something went wrong.',
};

// ─── Portuguese ───────────────────────────────────────────────────────────────

const pt: Translations = {
  cancel: 'Cancelar',
  save: 'Salvar',
  untitledRecipe: 'Receita sem título',

  tabHome: 'Início',
  tabFavorites: 'Favoritos',
  tabExchange: 'Trocar',
  tabProfile: 'Perfil',

  sectionDrafts: 'RASCUNHOS',
  sectionPublished: 'PUBLICADAS',

  emptyTitle: 'Nenhuma receita ainda',
  emptySub: 'Toque em Nova Receita para começar.',

  ingredient: 'ingrediente',
  ingredients: 'ingredientes',

  profileTitle: 'Perfil',
  profileNameSub: 'Este nome aparecerá nos seus cartões de receita.',
  profileNamePlaceholder: 'Digite seu nome',
  profileLanguageLabel: 'Idioma',

  viewCardTitle: 'Ver Cartão Compartilhado',
  viewCardSub: 'Cole o ID do cartão de um link de receita compartilhado.',
  viewCardPlaceholder: 'Cole o ID do cartão aqui',
  viewCardBtn: 'Ver Receita',

  qrCameraTitle: 'Câmera Necessária',
  qrCameraSub: 'Permita o acesso à câmera para ler QR codes de receitas.',
  qrCameraSettings: 'Ative a câmera nas configurações do dispositivo.',
  qrAllowCamera: 'Permitir Câmera',
  qrScanTitle: 'Ler Cartão de Receita',
  qrAlignHint: 'Alinhe o QR code dentro do quadro',
  qrEnterManually: 'Digitar código manualmente',
  qrInvalidTitle: 'QR Code Inválido',
  qrInvalidBody: 'Este não parece ser um QR code do RecipeCards.',

  comingSoonTitle: 'Em Breve',
  comingSoonBody: 'Favoritos estarão disponíveis em uma atualização futura.',

  formBack: '← Início',
  formNewRecipe: 'NOVA RECEITA',
  formTitlePlaceholder: 'Título da receita',
  formAddPhoto: 'Adicionar Foto',
  formServes: 'PORÇÕES',
  formPrep: 'PREP',
  formCook: 'COZIMENTO',
  formIngredients: 'INGREDIENTES',
  formDirections: 'MODO DE PREPARO',
  formAddIngredient: '+ Adicionar ingrediente',
  formAddStep: '+ Adicionar passo',
  formPublish: 'Publicar',
  formPreviewCard: 'Visualizar Cartão',
  formSaveDraft: 'Salvar rascunho',
  formDraftSaved: '✓  Rascunho salvo',
  formIngredientPrefix: 'Ingrediente',
  formStepPrefix: 'Passo',

  voiceTapToRecord: 'Toque para gravar sua receita',
  voiceMicNeeded: 'Permissão de microfone necessária',
  voiceTranscribing: 'Transcrevendo e analisando…',
  voiceStop: 'Parar',
  voiceReRecord: 'Regravar',
  voiceRecordingDonePrefix: 'Gravação concluída',
  voiceMicPermTitle: 'Permissão de Microfone',
  voiceMicPermBody: 'Permita o acesso ao microfone para gravar receitas.',
  voiceNoSpeechTitle: 'Nenhuma fala detectada',
  voiceNoSpeechBody: 'Por favor, tente gravar novamente e fale claramente.',
  voiceFillFailedTitle: 'Falha no preenchimento por voz',

  publishConfirmHeadline: 'Pronto para publicar?',
  publishConfirmBody: 'Uma vez publicado, este cartão é permanente. Sem edições, sem volta. Esta é a sua receita, exatamente como está agora.',
  publishConfirmBtn: 'Publicar para sempre',
  publishConfirmCancel: 'Ainda não',

  previewBack: '← Voltar',
  previewEditRecipe: '← Editar Receita',

  deleteDraftTitle: 'Excluir Rascunho?',
  deleteCardTitle: 'Remover Cartão?',
  deleteDraftBody: (title) => `"${title}" será permanentemente excluído. Isso não pode ser desfeito.`,
  deleteCardBody: 'Todos com quem você compartilhou manterão sua cópia, mas não poderão compartilhar novamente.',
  deleteDraftBtn: 'Excluir para sempre',
  deleteCardBtn: 'Remover cartão',

  photoPickerTitle: 'Adicionar Foto',
  photoPickerSub: 'Como você gostaria de adicionar uma foto?',
  photoTakePhoto: 'Tirar Foto',
  photoChooseLibrary: 'Escolher da Biblioteca',

  cardViewBack: '← Início',
  cardViewRecipeBy: 'Receita de',
  cardViewNotFound: 'Receita não encontrada.',

  receiveBack: '← Voltar',
  receiveLoading: 'Carregando receita…',
  receiveNotFoundTitle: 'Receita não encontrada',
  receiveNotFoundBody: 'Esta receita não pôde ser encontrada ou não está mais disponível.',
  receiveBackHome: 'Voltar ao Início',
  receiveSharedBy: 'Compartilhado por',
  receiveAddBtn: 'Adicionar à Minha Coleção',
  receiveSaving: 'Salvando…',
  receiveAdded: 'Adicionado à coleção!',

  cloudSyncFailedTitle: 'Falha na sincronização',
  publishFailedTitle: 'Falha ao publicar',
  somethingWentWrong: 'Algo deu errado.',
};

// ─── German ───────────────────────────────────────────────────────────────────

const de: Translations = {
  cancel: 'Abbrechen',
  save: 'Speichern',
  untitledRecipe: 'Unbenanntes Rezept',

  tabHome: 'Start',
  tabFavorites: 'Favoriten',
  tabExchange: 'Austausch',
  tabProfile: 'Profil',

  sectionDrafts: 'ENTWÜRFE',
  sectionPublished: 'VERÖFFENTLICHT',

  emptyTitle: 'Noch keine Rezepte',
  emptySub: 'Tippe auf Neues Rezept, um zu beginnen.',

  ingredient: 'Zutat',
  ingredients: 'Zutaten',

  profileTitle: 'Profil',
  profileNameSub: 'Dieser Name erscheint auf Ihren Rezeptkarten.',
  profileNamePlaceholder: 'Namen eingeben',
  profileLanguageLabel: 'Sprache',

  viewCardTitle: 'Geteilte Karte ansehen',
  viewCardSub: 'Füge die Karten-ID aus einem geteilten Rezeptlink ein.',
  viewCardPlaceholder: 'Karten-ID hier einfügen',
  viewCardBtn: 'Rezept ansehen',

  qrCameraTitle: 'Kamerazugriff benötigt',
  qrCameraSub: 'Erlaube Kamerazugriff zum Scannen von Rezept-QR-Codes.',
  qrCameraSettings: 'Bitte aktiviere die Kamera in deinen Geräteeinstellungen.',
  qrAllowCamera: 'Kamera erlauben',
  qrScanTitle: 'Rezeptkarte scannen',
  qrAlignHint: 'QR-Code im Rahmen ausrichten',
  qrEnterManually: 'Code manuell eingeben',
  qrInvalidTitle: 'Ungültiger QR-Code',
  qrInvalidBody: 'Das sieht nicht wie ein RecipeCards-QR-Code aus.',

  comingSoonTitle: 'Demnächst',
  comingSoonBody: 'Favoriten werden in einem zukünftigen Update verfügbar sein.',

  formBack: '← Start',
  formNewRecipe: 'NEUES REZEPT',
  formTitlePlaceholder: 'Rezepttitel',
  formAddPhoto: 'Foto hinzufügen',
  formServes: 'PORTIONEN',
  formPrep: 'VORBEREITUNG',
  formCook: 'KOCHEN',
  formIngredients: 'ZUTATEN',
  formDirections: 'ANLEITUNG',
  formAddIngredient: '+ Zutat hinzufügen',
  formAddStep: '+ Schritt hinzufügen',
  formPublish: 'Veröffentlichen',
  formPreviewCard: 'Karte ansehen',
  formSaveDraft: 'Entwurf speichern',
  formDraftSaved: '✓  Entwurf gespeichert',
  formIngredientPrefix: 'Zutat',
  formStepPrefix: 'Schritt',

  voiceTapToRecord: 'Tippe zum Aufnehmen deines Rezepts',
  voiceMicNeeded: 'Mikrofonberechtigung benötigt',
  voiceTranscribing: 'Transkribiere & analysiere…',
  voiceStop: 'Stopp',
  voiceReRecord: 'Neu aufnehmen',
  voiceRecordingDonePrefix: 'Aufnahme fertig',
  voiceMicPermTitle: 'Mikrofonberechtigung',
  voiceMicPermBody: 'Bitte erlaube Mikrofonzugriff zum Aufnehmen von Rezepten.',
  voiceNoSpeechTitle: 'Keine Sprache erkannt',
  voiceNoSpeechBody: 'Bitte versuche erneut aufzunehmen und sprich deutlich.',
  voiceFillFailedTitle: 'Sprachausfüllung fehlgeschlagen',

  publishConfirmHeadline: 'Bereit zum Veröffentlichen?',
  publishConfirmBody: 'Einmal veröffentlicht, ist diese Karte dauerhaft. Keine Bearbeitung, kein Zurück. Das ist dein Rezept, genau so wie es jetzt ist.',
  publishConfirmBtn: 'Für immer veröffentlichen',
  publishConfirmCancel: 'Noch nicht',

  previewBack: '← Zurück',
  previewEditRecipe: '← Rezept bearbeiten',

  deleteDraftTitle: 'Entwurf löschen?',
  deleteCardTitle: 'Karte entfernen?',
  deleteDraftBody: (title) => `"${title}" wird dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.`,
  deleteCardBody: 'Alle, mit denen du sie geteilt hast, behalten ihre Kopie, können die Karte aber nicht erneut teilen.',
  deleteDraftBtn: 'Für immer löschen',
  deleteCardBtn: 'Karte entfernen',

  photoPickerTitle: 'Foto hinzufügen',
  photoPickerSub: 'Wie möchtest du ein Foto hinzufügen?',
  photoTakePhoto: 'Foto aufnehmen',
  photoChooseLibrary: 'Aus Bibliothek wählen',

  cardViewBack: '← Start',
  cardViewRecipeBy: 'Rezept von',
  cardViewNotFound: 'Rezept nicht gefunden.',

  receiveBack: '← Zurück',
  receiveLoading: 'Rezept wird geladen…',
  receiveNotFoundTitle: 'Rezept nicht gefunden',
  receiveNotFoundBody: 'Dieses Rezept konnte nicht gefunden werden oder ist nicht mehr verfügbar.',
  receiveBackHome: 'Zurück zur Startseite',
  receiveSharedBy: 'Geteilt von',
  receiveAddBtn: 'Zu meiner Sammlung hinzufügen',
  receiveSaving: 'Speichern…',
  receiveAdded: 'Zur Sammlung hinzugefügt!',

  cloudSyncFailedTitle: 'Cloud-Sync fehlgeschlagen',
  publishFailedTitle: 'Veröffentlichung fehlgeschlagen',
  somethingWentWrong: 'Etwas ist schief gelaufen.',
};

// ─── Spanish ──────────────────────────────────────────────────────────────────

const es: Translations = {
  cancel: 'Cancelar',
  save: 'Guardar',
  untitledRecipe: 'Receta sin título',

  tabHome: 'Inicio',
  tabFavorites: 'Favoritos',
  tabExchange: 'Compartir',
  tabProfile: 'Perfil',

  sectionDrafts: 'BORRADORES',
  sectionPublished: 'PUBLICADAS',

  emptyTitle: 'Sin recetas todavía',
  emptySub: 'Toca Nueva Receta para empezar.',

  ingredient: 'ingrediente',
  ingredients: 'ingredientes',

  profileTitle: 'Perfil',
  profileNameSub: 'Este nombre aparecerá en tus tarjetas de receta.',
  profileNamePlaceholder: 'Escribe tu nombre',
  profileLanguageLabel: 'Idioma',

  viewCardTitle: 'Ver Tarjeta Compartida',
  viewCardSub: 'Pega el ID de tarjeta de un enlace de receta compartido.',
  viewCardPlaceholder: 'Pega el ID de tarjeta aquí',
  viewCardBtn: 'Ver Receta',

  qrCameraTitle: 'Acceso a Cámara Necesario',
  qrCameraSub: 'Permite el acceso a la cámara para escanear códigos QR de recetas.',
  qrCameraSettings: 'Activa la cámara en los ajustes del dispositivo.',
  qrAllowCamera: 'Permitir Cámara',
  qrScanTitle: 'Escanear Tarjeta de Receta',
  qrAlignHint: 'Alinea el código QR dentro del marco',
  qrEnterManually: 'Introducir código manualmente',
  qrInvalidTitle: 'Código QR Inválido',
  qrInvalidBody: 'Esto no parece ser un código QR de RecipeCards.',

  comingSoonTitle: 'Próximamente',
  comingSoonBody: 'Los favoritos estarán disponibles en una próxima actualización.',

  formBack: '← Inicio',
  formNewRecipe: 'NUEVA RECETA',
  formTitlePlaceholder: 'Título de la receta',
  formAddPhoto: 'Añadir Foto',
  formServes: 'RACIONES',
  formPrep: 'PREP',
  formCook: 'COCCIÓN',
  formIngredients: 'INGREDIENTES',
  formDirections: 'INSTRUCCIONES',
  formAddIngredient: '+ Añadir ingrediente',
  formAddStep: '+ Añadir paso',
  formPublish: 'Publicar',
  formPreviewCard: 'Vista previa',
  formSaveDraft: 'Guardar borrador',
  formDraftSaved: '✓  Borrador guardado',
  formIngredientPrefix: 'Ingrediente',
  formStepPrefix: 'Paso',

  voiceTapToRecord: 'Toca para grabar tu receta',
  voiceMicNeeded: 'Se necesita permiso de micrófono',
  voiceTranscribing: 'Transcribiendo y analizando…',
  voiceStop: 'Parar',
  voiceReRecord: 'Volver a grabar',
  voiceRecordingDonePrefix: 'Grabación lista',
  voiceMicPermTitle: 'Permiso de Micrófono',
  voiceMicPermBody: 'Permite el acceso al micrófono para grabar recetas.',
  voiceNoSpeechTitle: 'No se detectó voz',
  voiceNoSpeechBody: 'Por favor, intenta grabar de nuevo y habla con claridad.',
  voiceFillFailedTitle: 'Error al rellenar por voz',

  publishConfirmHeadline: '¿Listo para publicar?',
  publishConfirmBody: 'Una vez publicada, esta tarjeta es permanente. Sin ediciones, sin marcha atrás. Esta es tu receta, exactamente como está ahora.',
  publishConfirmBtn: 'Publicar para siempre',
  publishConfirmCancel: 'Todavía no',

  previewBack: '← Volver',
  previewEditRecipe: '← Editar Receta',

  deleteDraftTitle: '¿Eliminar Borrador?',
  deleteCardTitle: '¿Eliminar Tarjeta?',
  deleteDraftBody: (title) => `"${title}" se eliminará permanentemente. Esto no se puede deshacer.`,
  deleteCardBody: 'Todos con quienes la compartiste conservarán su copia, pero no podrán volver a compartir la tarjeta.',
  deleteDraftBtn: 'Eliminar para siempre',
  deleteCardBtn: 'Eliminar tarjeta',

  photoPickerTitle: 'Añadir Foto',
  photoPickerSub: '¿Cómo quieres añadir una foto?',
  photoTakePhoto: 'Tomar Foto',
  photoChooseLibrary: 'Elegir de la Biblioteca',

  cardViewBack: '← Inicio',
  cardViewRecipeBy: 'Receta de',
  cardViewNotFound: 'Receta no encontrada.',

  receiveBack: '← Volver',
  receiveLoading: 'Cargando receta…',
  receiveNotFoundTitle: 'Receta no encontrada',
  receiveNotFoundBody: 'Esta receta no se pudo encontrar o ya no está disponible.',
  receiveBackHome: 'Volver al Inicio',
  receiveSharedBy: 'Compartido por',
  receiveAddBtn: 'Añadir a Mi Colección',
  receiveSaving: 'Guardando…',
  receiveAdded: '¡Añadido a la colección!',

  cloudSyncFailedTitle: 'Error de sincronización',
  publishFailedTitle: 'Error al publicar',
  somethingWentWrong: 'Algo salió mal.',
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const translations: Record<Language, Translations> = { en, pt, de, es };
