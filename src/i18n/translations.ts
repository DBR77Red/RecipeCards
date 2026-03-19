export type Language = 'en' | 'pt' | 'de' | 'es';

export interface Translations {
  // Onboarding
  onboardingBody: string;
  onboardingBtn: string;

  // Common
  cancel: string;
  ok: string;
  save: string;
  untitledRecipe: string;

  // Tab bar
  tabHome: string;
  tabFavorites: string;
  tabExchange: string;
  tabProfile: string;
  tabSettings: string;

  // List sections
  sectionDrafts: string;
  sectionPublished: string;
  sectionReceived: string;

  // Filter pills
  filterAll: string;
  filterDrafts: string;
  filterPublished: string;
  filterReceived: string;

  // Filter empty states
  filterEmptyDraftsTitle: string;
  filterEmptyDraftsSub: string;
  filterEmptyPublishedTitle: string;
  filterEmptyPublishedSub: string;
  filterEmptyReceivedTitle: string;
  filterEmptyReceivedSub: string;

  // Empty state
  emptyTitle: string;
  emptySub: string;

  // Ingredient count
  ingredient: string;
  ingredients: string;

  // Profile / Settings
  settingsTitle: string;
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

  // Favorites screen
  favoritesTitle: string;
  favoritesEmptyTitle: string;
  favoritesEmptySub: string;

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
  voiceFailedModalTitle: string;
  voiceFailedModalBody: string;
  voiceFailedModalRetry: string;

  // Publish confirm
  publishConfirmHeadline: string;
  publishConfirmBody: string;
  publishConfirmBtn: string;
  publishConfirmCancel: string;

  // Preview screen
  previewBack: string;
  previewEditRecipe: string;
  previewReceiveCount: (n: number) => string;
  previewReceiveNone: string;

  // Delete modal
  deleteDraftTitle: string;
  deleteCardTitle: string;
  deleteDraftBody: (title: string) => string;
  deleteCardBody: string;
  deleteDraftBtn: string;
  deleteCardBtn: string;

  // Batch delete
  deleteBatchTitle: (count: number) => string;
  deleteBatchBody: string;
  deleteBatchBtn: (count: number) => string;

  // Selection bar
  selectionCount: (count: number) => string;
  selectionDelete: string;

  // Photo picker
  photoPickerTitle: string;
  photoPickerSub: string;
  photoTakePhoto: string;
  photoChooseLibrary: string;

  // RecipeCard component
  cardBy: string;
  cardServes: string;
  cardPrep: string;
  cardCook: string;
  cardScanHint: string;
  cardShareBtn: string;
  cardReadyToShare: string;
  cardPublishHint: string;
  cardPublishing: string;
  cardPublishBtn: string;
  cardTapToFlip: string;
  cardIngredients: string;
  cardInstructions: string;

  // CardView screen
  cardViewBack: string;
  cardViewRecipeBy: string;
  cardViewNotFound: string;

  // Deck screen
  deckPosition: (current: number, total: number) => string;
  deckTapHint: string;

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
  saveDraftFailedTitle: string;
  somethingWentWrong: string;
}

// ─── English ──────────────────────────────────────────────────────────────────

const en: Translations = {
  onboardingBody: 'Welcome to Recipe Cards.\n\nThis app is made for friends and family at the moment, and is still under development. If you have suggestions or find bugs, please contact the developer.\n\nThanks for taking the time to test it out.',
  onboardingBtn: 'Start using the app',

  cancel: 'Cancel',
  ok: 'OK',
  save: 'Save',
  untitledRecipe: 'Untitled Recipe',

  tabHome: 'Home',
  tabFavorites: 'Favorites',
  tabExchange: 'Exchange',
  tabProfile: 'Profile',
  tabSettings: 'Settings',

  sectionDrafts: 'YOUR DRAFTS',
  sectionPublished: 'PUBLISHED',
  sectionReceived: 'RECEIVED',

  filterAll: 'All',
  filterDrafts: 'Drafts',
  filterPublished: 'Published',
  filterReceived: 'Received',

  filterEmptyDraftsTitle: 'No draft cards yet',
  filterEmptyDraftsSub: 'Save a draft to see it here.',
  filterEmptyPublishedTitle: 'No published cards yet',
  filterEmptyPublishedSub: 'Publish a recipe to see it here.',
  filterEmptyReceivedTitle: 'No received cards yet',
  filterEmptyReceivedSub: 'Exchange a card with someone to see it here.',

  emptyTitle: 'No recipes yet',
  emptySub: 'Tap New Recipe to get started.',

  ingredient: 'ingredient',
  ingredients: 'ingredients',

  settingsTitle: 'Settings',
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

  favoritesTitle: 'Favorites',
  favoritesEmptyTitle: 'No favorites yet',
  favoritesEmptySub: 'Tap the ♡ on a published or received card to save it here.',

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
  voiceFailedModalTitle: "We couldn't hear you",
  voiceFailedModalBody: "For some reason we could not get your voice. Could you try again and maybe speak a little louder?",
  voiceFailedModalRetry: 'Try Again',

  publishConfirmHeadline: 'Ready to publish?',
  publishConfirmBody: 'Once published, this card is permanent. No edits, no take-backs. This is your recipe, exactly as it is right now.',
  publishConfirmBtn: 'Publish forever',
  publishConfirmCancel: 'Not yet',

  previewBack: '← Back',
  previewEditRecipe: '← Edit Recipe',
  previewReceiveCount: (n) => n === 1 ? '1 person received this card' : `${n} people received this card`,
  previewReceiveNone: 'No one has received this card yet',

  deleteDraftTitle: 'Delete Draft?',
  deleteCardTitle: 'Remove Card?',
  deleteDraftBody: (title) => `"${title}" will be permanently deleted. This cannot be undone.`,
  deleteCardBody: "Everyone you shared it with will keep their copy, but they won't be able to re-share the card.",
  deleteDraftBtn: 'Delete forever',
  deleteCardBtn: 'Remove card',

  deleteBatchTitle: (n) => `Delete ${n} cards?`,
  deleteBatchBody: 'Drafts will be permanently deleted. Published cards will be hidden immediately — recipients keep their copy but cannot re-share.',
  deleteBatchBtn: (n) => `Delete ${n} cards`,

  selectionCount: (n) => n === 1 ? '1 selected' : `${n} selected`,
  selectionDelete: 'Delete',

  photoPickerTitle: 'Add Photo',
  photoPickerSub: 'How would you like to add a photo?',
  photoTakePhoto: 'Take Photo',
  photoChooseLibrary: 'Choose from Library',

  cardBy: 'By',
  cardServes: 'Serves',
  cardPrep: 'Prep',
  cardCook: 'Cook',
  cardScanHint: 'Scan to receive this recipe',
  cardShareBtn: 'Share Recipe',
  cardReadyToShare: 'Ready to share?',
  cardPublishHint: 'Publish to get your QR code',
  cardPublishing: 'Publishing…',
  cardPublishBtn: 'Publish to Share',
  cardTapToFlip: 'Tap to flip back',
  cardIngredients: 'Ingredients',
  cardInstructions: 'Instructions',

  cardViewBack: '← Home',
  cardViewRecipeBy: 'Recipe by',
  cardViewNotFound: 'Recipe not found.',

  deckPosition: (c, t) => `${c} of ${t}`,
  deckTapHint: 'Tap to view · swipe to browse',

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
  saveDraftFailedTitle: 'Save failed',
  somethingWentWrong: 'Something went wrong.',
};

// ─── Portuguese ───────────────────────────────────────────────────────────────

const pt: Translations = {
  onboardingBody: 'Bem-vindo ao Recipe Cards.\n\nEste aplicativo foi criado para amigos e família por enquanto, e ainda está em desenvolvimento. Se tiver sugestões ou encontrar bugs, por favor entre em contato com o desenvolvedor.\n\nObrigado por dedicar seu tempo para testá-lo.',
  onboardingBtn: 'Começar a usar o app',

  cancel: 'Cancelar',
  ok: 'OK',
  save: 'Salvar',
  untitledRecipe: 'Receita sem título',

  tabHome: 'Início',
  tabFavorites: 'Favoritos',
  tabExchange: 'Trocar',
  tabProfile: 'Perfil',
  tabSettings: 'Definições',

  sectionDrafts: 'RASCUNHOS',
  sectionPublished: 'PUBLICADAS',
  sectionReceived: 'RECEBIDAS',

  filterAll: 'Tudo',
  filterDrafts: 'Rascunhos',
  filterPublished: 'Publicadas',
  filterReceived: 'Recebidas',

  filterEmptyDraftsTitle: 'Nenhum rascunho ainda',
  filterEmptyDraftsSub: 'Salve um rascunho para vê-lo aqui.',
  filterEmptyPublishedTitle: 'Nenhuma receita publicada ainda',
  filterEmptyPublishedSub: 'Publique uma receita para vê-la aqui.',
  filterEmptyReceivedTitle: 'Nenhuma receita recebida ainda',
  filterEmptyReceivedSub: 'Troque um cartão com alguém para ver aqui.',

  emptyTitle: 'Nenhuma receita ainda',
  emptySub: 'Toque em Nova Receita para começar.',

  ingredient: 'ingrediente',
  ingredients: 'ingredientes',

  settingsTitle: 'Configurações',
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

  favoritesTitle: 'Favoritos',
  favoritesEmptyTitle: 'Nenhum favorito ainda',
  favoritesEmptySub: 'Toque no ♡ de um cartão publicado ou recebido para salvá-lo aqui.',

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
  voiceFailedModalTitle: 'Não conseguimos ouvir você',
  voiceFailedModalBody: 'Por algum motivo não conseguimos captar sua voz. Poderia tentar novamente e falar um pouco mais alto?',
  voiceFailedModalRetry: 'Tentar Novamente',

  publishConfirmHeadline: 'Pronto para publicar?',
  publishConfirmBody: 'Uma vez publicado, este cartão é permanente. Sem edições, sem volta. Esta é a sua receita, exatamente como está agora.',
  publishConfirmBtn: 'Publicar para sempre',
  publishConfirmCancel: 'Ainda não',

  previewBack: '← Voltar',
  previewEditRecipe: '← Editar Receita',
  previewReceiveCount: (n) => n === 1 ? '1 pessoa recebeu este cartão' : `${n} pessoas receberam este cartão`,
  previewReceiveNone: 'Ninguém recebeu este cartão ainda',

  deleteDraftTitle: 'Excluir Rascunho?',
  deleteCardTitle: 'Remover Cartão?',
  deleteDraftBody: (title) => `"${title}" será permanentemente excluído. Isso não pode ser desfeito.`,
  deleteCardBody: 'Todos com quem você compartilhou manterão sua cópia, mas não poderão compartilhar novamente.',
  deleteDraftBtn: 'Excluir para sempre',
  deleteCardBtn: 'Remover cartão',

  deleteBatchTitle: (n) => `Excluir ${n} cartões?`,
  deleteBatchBody: 'Rascunhos serão excluídos permanentemente. Cartões publicados serão ocultados imediatamente — quem recebeu mantém a cópia, mas não pode recompartilhar.',
  deleteBatchBtn: (n) => `Excluir ${n} cartões`,

  selectionCount: (n) => n === 1 ? '1 selecionado' : `${n} selecionados`,
  selectionDelete: 'Excluir',

  photoPickerTitle: 'Adicionar Foto',
  photoPickerSub: 'Como você gostaria de adicionar uma foto?',
  photoTakePhoto: 'Tirar Foto',
  photoChooseLibrary: 'Escolher da Biblioteca',

  cardBy: 'Por',
  cardServes: 'Porções',
  cardPrep: 'Prep',
  cardCook: 'Cozimento',
  cardScanHint: 'Escaneie para receber esta receita',
  cardShareBtn: 'Compartilhar Receita',
  cardReadyToShare: 'Pronto para compartilhar?',
  cardPublishHint: 'Publique para obter seu QR code',
  cardPublishing: 'Publicando…',
  cardPublishBtn: 'Publicar e Compartilhar',
  cardTapToFlip: 'Toque para virar',
  cardIngredients: 'Ingredientes',
  cardInstructions: 'Instruções',

  cardViewBack: '← Início',
  cardViewRecipeBy: 'Receita de',
  cardViewNotFound: 'Receita não encontrada.',

  deckPosition: (c, t) => `${c} de ${t}`,
  deckTapHint: 'Toque para ver · deslize para navegar',

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
  saveDraftFailedTitle: 'Falha ao salvar',
  somethingWentWrong: 'Algo deu errado.',
};

// ─── German ───────────────────────────────────────────────────────────────────

const de: Translations = {
  onboardingBody: 'Willkommen bei Recipe Cards.\n\nDiese App ist momentan für Freunde und Familie gedacht und befindet sich noch in der Entwicklung. Wenn du Vorschläge hast oder Fehler findest, wende dich bitte an den Entwickler.\n\nVielen Dank, dass du dir die Zeit nimmst, sie zu testen.',
  onboardingBtn: 'App starten',

  cancel: 'Abbrechen',
  ok: 'OK',
  save: 'Speichern',
  untitledRecipe: 'Unbenanntes Rezept',

  tabHome: 'Start',
  tabFavorites: 'Favoriten',
  tabExchange: 'Austausch',
  tabProfile: 'Profil',
  tabSettings: 'Einstellungen',

  sectionDrafts: 'ENTWÜRFE',
  sectionPublished: 'VERÖFFENTLICHT',
  sectionReceived: 'ERHALTEN',

  filterAll: 'Alle',
  filterDrafts: 'Entwürfe',
  filterPublished: 'Veröffentlicht',
  filterReceived: 'Erhalten',

  filterEmptyDraftsTitle: 'Noch keine Entwürfe',
  filterEmptyDraftsSub: 'Speichere einen Entwurf, um ihn hier zu sehen.',
  filterEmptyPublishedTitle: 'Noch keine veröffentlichten Rezepte',
  filterEmptyPublishedSub: 'Veröffentliche ein Rezept, um es hier zu sehen.',
  filterEmptyReceivedTitle: 'Noch keine erhaltenen Karten',
  filterEmptyReceivedSub: 'Tausche eine Karte mit jemandem aus, um sie hier zu sehen.',

  emptyTitle: 'Noch keine Rezepte',
  emptySub: 'Tippe auf Neues Rezept, um zu beginnen.',

  ingredient: 'Zutat',
  ingredients: 'Zutaten',

  settingsTitle: 'Einstellungen',
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

  favoritesTitle: 'Favoriten',
  favoritesEmptyTitle: 'Noch keine Favoriten',
  favoritesEmptySub: 'Tippe auf ♡ bei einer veröffentlichten oder erhaltenen Karte, um sie hier zu speichern.',

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
  voiceFailedModalTitle: 'Wir konnten dich nicht hören',
  voiceFailedModalBody: 'Aus irgendeinem Grund konnten wir deine Stimme nicht aufnehmen. Könntest du es nochmal versuchen und vielleicht etwas lauter sprechen?',
  voiceFailedModalRetry: 'Nochmal versuchen',

  publishConfirmHeadline: 'Bereit zum Veröffentlichen?',
  publishConfirmBody: 'Einmal veröffentlicht, ist diese Karte dauerhaft. Keine Bearbeitung, kein Zurück. Das ist dein Rezept, genau so wie es jetzt ist.',
  publishConfirmBtn: 'Für immer veröffentlichen',
  publishConfirmCancel: 'Noch nicht',

  previewBack: '← Zurück',
  previewEditRecipe: '← Rezept bearbeiten',
  previewReceiveCount: (n) => n === 1 ? '1 Person hat diese Karte erhalten' : `${n} Personen haben diese Karte erhalten`,
  previewReceiveNone: 'Noch niemand hat diese Karte erhalten',

  deleteDraftTitle: 'Entwurf löschen?',
  deleteCardTitle: 'Karte entfernen?',
  deleteDraftBody: (title) => `"${title}" wird dauerhaft gelöscht. Dies kann nicht rückgängig gemacht werden.`,
  deleteCardBody: 'Alle, mit denen du sie geteilt hast, behalten ihre Kopie, können die Karte aber nicht erneut teilen.',
  deleteDraftBtn: 'Für immer löschen',
  deleteCardBtn: 'Karte entfernen',

  deleteBatchTitle: (n) => `${n} Karten löschen?`,
  deleteBatchBody: 'Entwürfe werden dauerhaft gelöscht. Veröffentlichte Karten werden sofort ausgeblendet — Empfänger behalten ihre Kopie, können sie aber nicht erneut teilen.',
  deleteBatchBtn: (n) => `${n} Karten löschen`,

  selectionCount: (n) => n === 1 ? '1 ausgewählt' : `${n} ausgewählt`,
  selectionDelete: 'Löschen',

  photoPickerTitle: 'Foto hinzufügen',
  photoPickerSub: 'Wie möchtest du ein Foto hinzufügen?',
  photoTakePhoto: 'Foto aufnehmen',
  photoChooseLibrary: 'Aus Bibliothek wählen',

  cardBy: 'Von',
  cardServes: 'Portionen',
  cardPrep: 'Vorbereitung',
  cardCook: 'Kochen',
  cardScanHint: 'Scannen zum Empfangen dieses Rezepts',
  cardShareBtn: 'Rezept teilen',
  cardReadyToShare: 'Bereit zum Teilen?',
  cardPublishHint: 'Veröffentlichen für QR-Code',
  cardPublishing: 'Wird veröffentlicht…',
  cardPublishBtn: 'Veröffentlichen & Teilen',
  cardTapToFlip: 'Tippe zum Zurückdrehen',
  cardIngredients: 'Zutaten',
  cardInstructions: 'Anleitung',

  cardViewBack: '← Start',
  cardViewRecipeBy: 'Rezept von',
  cardViewNotFound: 'Rezept nicht gefunden.',

  deckPosition: (c, t) => `${c} von ${t}`,
  deckTapHint: 'Tippen zum Ansehen · Wischen zum Blättern',

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
  saveDraftFailedTitle: 'Speichern fehlgeschlagen',
  somethingWentWrong: 'Etwas ist schief gelaufen.',
};

// ─── Spanish ──────────────────────────────────────────────────────────────────

const es: Translations = {
  onboardingBody: 'Bienvenido a Recipe Cards.\n\nEsta app está hecha para amigos y familia por el momento, y todavía está en desarrollo. Si tienes sugerencias o encuentras errores, por favor contacta al desarrollador.\n\nGracias por tomarte el tiempo de probarla.',
  onboardingBtn: 'Empezar a usar la app',

  cancel: 'Cancelar',
  ok: 'OK',
  save: 'Guardar',
  untitledRecipe: 'Receta sin título',

  tabHome: 'Inicio',
  tabFavorites: 'Favoritos',
  tabExchange: 'Compartir',
  tabProfile: 'Perfil',
  tabSettings: 'Ajustes',

  sectionDrafts: 'BORRADORES',
  sectionPublished: 'PUBLICADAS',
  sectionReceived: 'RECIBIDAS',

  filterAll: 'Todo',
  filterDrafts: 'Borradores',
  filterPublished: 'Publicadas',
  filterReceived: 'Recibidas',

  filterEmptyDraftsTitle: 'Sin borradores aún',
  filterEmptyDraftsSub: 'Guarda un borrador para verlo aquí.',
  filterEmptyPublishedTitle: 'Sin recetas publicadas aún',
  filterEmptyPublishedSub: 'Publica una receta para verla aquí.',
  filterEmptyReceivedTitle: 'Sin tarjetas recibidas aún',
  filterEmptyReceivedSub: 'Intercambia una tarjeta con alguien para verla aquí.',

  emptyTitle: 'Sin recetas todavía',
  emptySub: 'Toca Nueva Receta para empezar.',

  ingredient: 'ingrediente',
  ingredients: 'ingredientes',

  settingsTitle: 'Ajustes',
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

  favoritesTitle: 'Favoritos',
  favoritesEmptyTitle: 'Sin favoritos aún',
  favoritesEmptySub: 'Toca el ♡ en una tarjeta publicada o recibida para guardarla aquí.',

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
  voiceFailedModalTitle: 'No pudimos escucharte',
  voiceFailedModalBody: 'Por alguna razón no pudimos captar tu voz. ¿Podrías intentarlo de nuevo y hablar un poco más alto?',
  voiceFailedModalRetry: 'Intentar de nuevo',

  publishConfirmHeadline: '¿Listo para publicar?',
  publishConfirmBody: 'Una vez publicada, esta tarjeta es permanente. Sin ediciones, sin marcha atrás. Esta es tu receta, exactamente como está ahora.',
  publishConfirmBtn: 'Publicar para siempre',
  publishConfirmCancel: 'Todavía no',

  previewBack: '← Volver',
  previewEditRecipe: '← Editar Receta',
  previewReceiveCount: (n) => n === 1 ? '1 persona recibió esta tarjeta' : `${n} personas recibieron esta tarjeta`,
  previewReceiveNone: 'Nadie ha recibido esta tarjeta todavía',

  deleteDraftTitle: '¿Eliminar Borrador?',
  deleteCardTitle: '¿Eliminar Tarjeta?',
  deleteDraftBody: (title) => `"${title}" se eliminará permanentemente. Esto no se puede deshacer.`,
  deleteCardBody: 'Todos con quienes la compartiste conservarán su copia, pero no podrán volver a compartir la tarjeta.',
  deleteDraftBtn: 'Eliminar para siempre',
  deleteCardBtn: 'Eliminar tarjeta',

  deleteBatchTitle: (n) => `¿Eliminar ${n} tarjetas?`,
  deleteBatchBody: 'Los borradores se eliminarán permanentemente. Las tarjetas publicadas se ocultarán de inmediato — los destinatarios conservan su copia pero no pueden recompartir.',
  deleteBatchBtn: (n) => `Eliminar ${n} tarjetas`,

  selectionCount: (n) => n === 1 ? '1 seleccionada' : `${n} seleccionadas`,
  selectionDelete: 'Eliminar',

  photoPickerTitle: 'Añadir Foto',
  photoPickerSub: '¿Cómo quieres añadir una foto?',
  photoTakePhoto: 'Tomar Foto',
  photoChooseLibrary: 'Elegir de la Biblioteca',

  cardBy: 'Por',
  cardServes: 'Raciones',
  cardPrep: 'Prep',
  cardCook: 'Cocción',
  cardScanHint: 'Escanea para recibir esta receta',
  cardShareBtn: 'Compartir Receta',
  cardReadyToShare: '¿Listo para compartir?',
  cardPublishHint: 'Publica para obtener tu código QR',
  cardPublishing: 'Publicando…',
  cardPublishBtn: 'Publicar y Compartir',
  cardTapToFlip: 'Toca para voltear',
  cardIngredients: 'Ingredientes',
  cardInstructions: 'Instrucciones',

  cardViewBack: '← Inicio',
  cardViewRecipeBy: 'Receta de',
  cardViewNotFound: 'Receta no encontrada.',

  deckPosition: (c, t) => `${c} de ${t}`,
  deckTapHint: 'Toca para ver · desliza para explorar',

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
  saveDraftFailedTitle: 'Error al guardar',
  somethingWentWrong: 'Algo salió mal.',
};

// ─── Export ───────────────────────────────────────────────────────────────────

export const translations: Record<Language, Translations> = { en, pt, de, es };
