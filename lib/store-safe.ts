// ВАЖНО: Эта версия НИКОГДА не удаляет машины!
// Замените resetGarage в store.ts на эту версию

const resetGarage = useCallback(async () => {
  console.log('[store] SAFE RESET - ONLY DELETING DOCUMENTS, NOT CARS!')
  console.log('[store] Current cars count:', state.cars.length)
  console.log('[store] Current cars:', state.cars.map(c => ({ id: c.id, name: c.name })))
  
  // ТОЛЬКО удаляем документы, НИКОГДА не трогаем машины!
  if (userId && db) {
    console.log('[store] Starting SAFE documents deletion...')
    const documentsRef = collection(db, 'users', userId, 'documents')
    const documentsSnap = await getDocs(documentsRef)
    console.log('[store] Found documents to delete:', documentsSnap.docs.length)
    
    if (documentsSnap.docs.length > 0) {
      const batch = writeBatch(db)
      documentsSnap.forEach((docDoc) => {
        console.log('[store] Deleting document:', docDoc.id)
        batch.delete(doc(documentsRef, docDoc.id))
      })
      
      await batch.commit()
      console.log('[store] Documents deleted, CARS PRESERVED!')
    } else {
      console.log('[store] No documents to delete')
    }
  } else {
    console.log('[store] No userId or db, skipping Firebase deletion')
  }
  
  // Сохраняем машины и настройки
  setState({
    ...defaultState,
    cars: state.cars, // АБСОЛЮТНО сохраняем все машины!
    settings: {
      ...defaultState.settings,
      // Сохраняем пользовательские настройки
      currency: state.settings.currency,
      language: state.settings.language,
      theme: state.settings.theme,
      features: state.settings.features,
    }
  })
  
  console.log('[store] SAFE RESET COMPLETE - ALL CARS PRESERVED!')
}, [userId, state.cars, state.settings])
