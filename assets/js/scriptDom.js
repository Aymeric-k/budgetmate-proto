import { Transaction, BudgetManager } from './budget.js'

const entrees = document.querySelector('#entrees')
const addE = document.querySelector('#addE')
const addS = document.querySelector('#addS')

const listEntry = document.querySelector('#listEntry')
const listSpending = document.querySelector('#listSpending')
const soldeMontant = document.querySelector('#soldeMontant')
const dateInput = document.querySelector('#datePicker')
const prevMonthBtn = document.querySelector('#prevMonthBtn')
const nextMonthBtn = document.querySelector('#nextMonthBtn')
const monthTitle = document.querySelector('#month-title')

const monPortefeuille = new BudgetManager()

let dateAffichee = new Date()

monPortefeuille.chargerTransactions()

updateUI()

function createFormInput(index, type, element) {
  if (element.querySelector('form')) return

  const formId = `form-${type}-${index}`
  element.innerHTML += `
    <form id="${formId}" action="" method="">
<fieldset>
        <label for="nom">Nom de l'ajout</label>
        <input type="text" name="nom" id="nom-${index}" placeholder="Optionnel" data-index="${
    index - 1
  }">
      </fieldset>
      <fieldset>
        <label for="montant">Montant</label>
        <input type="number" name="montant" id="montant-${index}" placeholder="Montant exact" data-index="${index}" data-type="${type}" class="transaction">
      </fieldset>
      <fieldset>
        <label for="dateAction">Date</label>
        <input type="date" name="dateAction" id="dateAction-${index}">
      </fieldset>
      <fieldset>
        <label for="recurrence">Récurrent ?</label>
        <input type="checkbox" id="recurrence-${index}" name="recurrence" value="non">
      </fieldset>
      <fieldset id="frequenceContainer-${index}"></fieldset>
      <button type="button" class="add">Ajouter</button>
    </form>
    `
  const recurrenceCheckbox = document.querySelector(`#recurrence-${index}`)
  const frequenceContainer = document.querySelector(`#frequenceContainer-${index}`)

  recurrenceCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      frequenceContainer.innerHTML = `
        <fieldset>
          <label for="frequence">Fréquence</label>
          <select name="frequence" id="frequence-${index}">
            <option value="quotidien">Tous les jours</option>
            <option value="hebdo">Chaque semaine</option>
            <option value="mensuel">Chaque mois</option>
            <option value="annuel">Chaque année</option>
          </select>
        </fieldset>
      `
    } else {
      frequenceContainer.innerHTML = ''
    }
  })
  const currentForm = document.getElementById(formId)
  const button = currentForm.querySelector('button')

  button.addEventListener('click', () => {
    const nom = currentForm.querySelector(`[id^=nom]`).value.trim()
    const montant = Number(currentForm.querySelector(`[id^=montant]`).value)
    const date = currentForm.querySelector(`[id^=dateAction]`).value
    const type = currentForm.querySelector(`[id^=montant]`).dataset.type
    if (!nom || !montant || !date) {
      alert('Merci de remplir au minimum les champs nom, montant et date.')
      return
    }

    const statut = getStatutFromDate(date)

    let recurrenceData = null
    if (currentForm.querySelector(`[id^=frequence]`)) {
      recurrenceData = currentForm.querySelector(`[id^=frequence]`).value
    }

    // On ajoute 'T00:00:00' pour forcer l'interprétation de la date
    // comme étant à minuit dans le fuseau horaire LOCAL de l'utilisateur,
    // et non en UTC. C'est la clé pour éviter les bugs de fuseau horaire.
    const transaction = new Transaction(
      nom,
      montant,
      type,
      new Date(date + 'T00:00:00'),
      statut,
      recurrenceData
    )
    monPortefeuille.ajouterTransaction(transaction)
    const message =
      type === 'entree' ? 'Entrée ajoutée avec succès !' : 'Dépense ajoutée avec succès !'
    showNotification(message, type) // On passe 'entree' ou 'depense' pour le style
    updateUI()
  })
}
function showNotification(message, type) {
  // 1. On cible le bon conteneur (attention à la faute de frappe "notifaction")
  const notificationContainer = document.querySelector('#notification-container')
  if (!notificationContainer) {
    console.error("Le conteneur de notifications #notification-container n'a pas été trouvé.")
    return
  }

  // 2. On crée la notification et on lui donne ses classes
  const notification = document.createElement('div')
  notification.classList.add('notification', type) // ex: 'notification entree'
  notification.textContent = message
  notificationContainer.appendChild(notification)

  // 3. On ajoute la classe 'show' pour la faire apparaître (après un court délai pour que la transition se déclenche)
  setTimeout(() => notification.classList.add('show'), 10)

  // 4. On planifie sa disparition
  setTimeout(() => {
    notification.classList.remove('show')
    // 5. On la supprime du DOM une fois l'animation de sortie terminée
    notification.addEventListener('transitionend', () => notification.remove())
  }, 4000) // La notification reste visible 4 secondes
}

addE.addEventListener('click', () => {
  const listEntryLength = listEntry.children.length
  createFormInput(listEntryLength, 'entree', listEntry)
})
addS.addEventListener('click', () => {
  const listSpendingLength = listSpending.children.length
  createFormInput(listSpendingLength, 'depense', listSpending)
})

function updateUI() {
  // Mettre à jour le titre du mois
  const moisAnnee = dateAffichee.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
  if (monthTitle) {
    monthTitle.textContent = moisAnnee.charAt(0).toUpperCase() + moisAnnee.slice(1)
  }

  const transactionsDuMois = monPortefeuille.filtrerParDate(dateAffichee)
  const entreeTransactions = transactionsDuMois.filter((t) => t.type === 'entree')
  const depenseTransactions = transactionsDuMois.filter((t) => t.type === 'depense')

  const colEntrees = document.querySelector('#col-entrees')
  const colDepenses = document.querySelector('#col-depenses')
  if (colDepenses && colEntrees) {
    document.querySelectorAll('.ligne-griffon').forEach((ligne) => {
      ligne.remove()
    })
    transactionsDuMois.forEach((transaction) => {
      updateGriffonColonne(transaction.type, transaction.montant, transaction.getDateFormatee())
    })
  }

  afficherTransactions(entreeTransactions, listEntry, transactionsDuMois)
  afficherTransactions(depenseTransactions, listSpending, transactionsDuMois)

  if (entreeTransactions.length === 0) {
    createFormInput(0, 'entree', listEntry)
  }
  if (depenseTransactions.length === 0) {
    createFormInput(0, 'depense', listSpending)
  }

  const soldeDisponible = monPortefeuille.calculerSoldeALaDate(new Date())
  const formattedDate = new Date().toLocaleDateString('fr-FR')
  const ligneTotale = document.querySelector('#ligne-totale')
  soldeMontant.textContent = `${soldeDisponible} € (Au ${formattedDate})`
  ligneTotale.textContent = `Solde : ${soldeDisponible} € (Au ${formattedDate})`

  const totalBox = document.querySelector('#totalBox')
  if (totalBox) {
    let bilanElement = totalBox.querySelector('#monthly-balance')
    if (!bilanElement) {
      bilanElement = document.createElement('span')
      bilanElement.id = 'monthly-balance'
      totalBox.appendChild(bilanElement)
    }

    const totalEntrees = entreeTransactions.reduce((acc, t) => acc + t.montant, 0)
    const totalDepenses = depenseTransactions.reduce((acc, t) => acc + t.montant, 0)
    const bilan = totalEntrees - totalDepenses
    const bilanClass = bilan >= 0 ? 'bilan-positif' : 'bilan-negatif'
    const moisNom = dateAffichee.toLocaleDateString('fr-FR', { month: 'long' })

    bilanElement.innerHTML = `
      Bilan ${moisNom}: <span class="${bilanClass}">${bilan.toFixed(2)} €</span>
    `
  }
}

function afficherTransactions(transactions, containerElement, transactionsDuMois) {
  containerElement.innerHTML = ''
  if (transactions.length === 0) {
    const type = containerElement.id === 'listEntry' ? 'entree' : 'depense'
    createFormInput(transactionsDuMois.length, type, containerElement)
  }
  const fragment = document.createDocumentFragment()
  transactions.forEach((transaction) => {
    const postItDiv = document.createElement('div')
    const postItClass = transaction.type === 'entree' ? 'entree' : 'depense'
    postItDiv.className = `post-it ${postItClass}`
    const btnContainer = document.createElement('div')
    btnContainer.className = 'btn-container'
    postItDiv.appendChild(btnContainer)

    if (transaction.isGenerated) {
      const recurIcon = document.createElement('span')
      recurIcon.className = 'recur-icon post-it-btn'
      recurIcon.textContent = '🔄'
      btnContainer.appendChild(recurIcon)

      // On ajoute un bouton d'édition pour les instances
      const editBtn = document.createElement('button')
      editBtn.className = 'edit-btn post-it-btn'
      editBtn.textContent = '✏️'
      editBtn.dataset.index = transaction.originalRuleIndex // Index de la règle d'origine
      editBtn.dataset.instanceDate = transaction.date.toISOString() // Date de cette instance spécifique
      btnContainer.appendChild(editBtn)
    } else {
      const globalIndex = monPortefeuille.transactions.indexOf(transaction)
      const editBtn = document.createElement('button')
      editBtn.className = 'edit-btn post-it-btn'
      editBtn.textContent = '✏️'
      editBtn.dataset.index = globalIndex
      btnContainer.appendChild(editBtn)

      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'delete-btn post-it-btn'
      deleteBtn.textContent = '🗑️'
      deleteBtn.dataset.index = globalIndex
      btnContainer.appendChild(deleteBtn)
    }

    const proprietesACacher = ['recurrence', 'dateDeFin', 'isGenerated', 'originalRuleIndex']

    Object.keys(transaction).forEach((key) => {
      if (!proprietesACacher.includes(key)) {
        const p = document.createElement('p')
        const boldSpan = document.createElement('span')
        boldSpan.className = 'bold'
        boldSpan.textContent = `${key}`
        p.appendChild(boldSpan)

        let ligne = ` : `

        if (key === 'date') {
          ligne += ` ${transaction.getDateFormatee()}`
        } else if (key === 'statut') {
          ligne += ` ${transaction[key] === 'prévu' ? 'prévu ⏳' : 'réalisé ✅'}`
        } else {
          ligne += ` ${transaction[key]}`
        }
        p.appendChild(document.createTextNode(ligne))
        postItDiv.appendChild(p)
      }
      fragment.appendChild(postItDiv)
    })
    containerElement.appendChild(fragment)
  })
}
function handleListClick(e) {
  if (e.target.classList.contains('delete-btn')) {
    const index = e.target.dataset.index

    if (!isNaN(index)) {
      monPortefeuille.supprimerTransaction(index)
      updateUI()
    }
  } else if (e.target.classList.contains('edit-btn')) {
    const parentElement = e.target.closest('.post-it')
    const index = e.target.dataset.index
    const instanceDateStr = e.target.dataset.instanceDate

    const transaction = monPortefeuille.transactions[index]

    // On utilise la date de l'instance pour le formulaire si elle existe, sinon la date de la transaction de base.
    const dateForForm = instanceDateStr ? new Date(instanceDateStr) : transaction.date
    const inputDateValue = formatDateForInput(dateForForm)

    parentElement.classList.add('edit')
    parentElement.innerHTML = `

      <input type="text" name="nom" id="nom-${index}" placeholder="Optionnel" data-index="${
      index - 1
    }" value = "${transaction.nom}">
      <input type="number" name="montant" id="montant-${index}" placeholder="Montant exact" data-index="${index}" data-type="${
      transaction.type
    }" class="transaction" value = "${transaction.montant}">
      <input type="date" name="dateAction" id="dateAction-${index}" value = "${inputDateValue}">
      <fieldset>
      <label for="recurrence">Récurrent ?</label>
      <input type="checkbox" id="recurrence-${index}" name="recurrence" ${
      transaction.recurrence ? 'checked' : ''
    }>
    </fieldset>
      <fieldset id="frequenceContainer-${index}"></fieldset>
      <fieldset class="edit-buttons">
        <button type="button" class="cancel-btn">❌</button>
        <button type="button" class="save-btn">✔️</button>
      </fieldset>
    `
    const recurrenceCheckbox = parentElement.querySelector(`#recurrence-${index}`)
    const frequenceContainer = parentElement.querySelector(`#frequenceContainer-${index}`)

    // Fonction pour afficher/cacher le sélecteur de fréquence
    const toggleFrequenceSelector = () => {
      if (recurrenceCheckbox.checked) {
        const currentFrequence = transaction.recurrence ? transaction.recurrence : 'mensuel'
        frequenceContainer.innerHTML = `
          <label for="frequence-${index}">Fréquence</label>
          <select name="frequence" id="frequence-${index}">
            <option value="mensuel" ${
              currentFrequence === 'mensuel' ? 'selected' : ''
            }>Chaque mois</option>
            <option value="hebdo" ${
              currentFrequence === 'hebdo' ? 'selected' : ''
            }>Chaque semaine</option>
            <option value="annuel" ${
              currentFrequence === 'annuel' ? 'selected' : ''
            }>Chaque année</option>
          </select>
        `
      } else {
        frequenceContainer.innerHTML = ''
      }
    }

    // On l'appelle une première fois pour initialiser l'état du formulaire
    toggleFrequenceSelector()
    // Et on ajoute un écouteur pour les changements futurs
    recurrenceCheckbox.addEventListener('change', toggleFrequenceSelector)

    const cancelBtn = parentElement.querySelector('.cancel-btn')
    cancelBtn.addEventListener('click', () => {
      updateUI()
    })
    const saveBtn = parentElement.querySelector('.save-btn')
    saveBtn.addEventListener('click', () => {
      const nom = parentElement.querySelector(`#nom-${index}`).value.trim()
      const montant = Number(parentElement.querySelector(`#montant-${index}`).value)
      const date = parentElement.querySelector(`#dateAction-${index}`).value
      const isRecurrent = parentElement.querySelector(`#recurrence-${index}`).checked
      // On s'assure que la date est interprétée en fuseau horaire local
      // pour être cohérent avec la création de transaction.
      const datePourMAJ = new Date(date + 'T00:00:00')

      let recurrenceData = null
      if (isRecurrent) {
        recurrenceData = parentElement.querySelector(`#frequence-${index}`).value
      }

      const nouvellesDonnes = {
        nom: nom,
        montant: montant,
        date: datePourMAJ,
        recurrence: recurrenceData,
        statut: getStatutFromDate(date),
      }
      monPortefeuille.modifierTransaction(index, nouvellesDonnes)
      updateUI()
    })
  }
}
listEntry.addEventListener('click', handleListClick)
listSpending.addEventListener('click', handleListClick)

function formatDateForInput(date) {
  if (!(date instanceof Date) || isNaN(date)) {
    return ''
  }

  return date.toISOString().slice(0, 10)
}

function getStatutFromDate(dateString) {
  const today = new Date()
  const dateInput = new Date(dateString)

  today.setHours(0, 0, 0, 0)
  dateInput.setHours(0, 0, 0, 0)

  return dateInput > today ? 'prévu' : 'réalisé'
}
function updateGriffonColonne(type, montant, date) {
  const ligne = document.createElement('div')
  ligne.className = 'ligne-griffon'
  ligne.innerHTML = `<p>${
    type === 'entree' ? '+ ' : '- '
  }${montant} € <span class="griffon-date">(${date})</span></p>`
  document.querySelector(`#col-${type === 'entree' ? 'entrees' : 'depenses'}`).appendChild(ligne)
}

const toggleBtn = document.getElementById('toggleSnippet')
const snippet = document.getElementById('griffonSnippet')

toggleBtn.addEventListener('click', () => {
  if (snippet.classList.contains('open')) {
    snippet.classList.add('closing')
    snippet.style.pointerEvents = 'none'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    setTimeout(() => {
      snippet.classList.remove('open', 'closing')
      snippet.style.pointerEvents = ''
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }, 300)
    toggleBtn.textContent = '👁️ Aperçu rapide'
  } else {
    snippet.classList.add('open')
    toggleBtn.textContent = '🙈 Cache'
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
  }
})

dateInput.addEventListener('click', (e) => {
  try {
    console.log('test')
    e.target.showPicker()
  } catch (error) {
    console.log('date.showPicker() not supported.')
  }
})
dateInput.addEventListener('change', () => {
  const selectedDateString = dateInput.value
  const ligneTotale = document.querySelector('#ligne-totale')

  if (!selectedDateString) {
    // On met à jour l'état et on redessine la vue
    dateAffichee = new Date()
    updateUI()

    // On met à jour le solde
    const soldeActuel = monPortefeuille.calculerSoldeALaDate(new Date())
    soldeMontant.textContent = `${soldeActuel} €`
    if (ligneTotale) {
      ligneTotale.textContent = `Solde : ${soldeActuel} €`
    }
    return
  }
  // --- Logique de mise à jour de la vue ---
  // On applique la même logique ici pour que la date sélectionnée
  // soit aussi interprétée comme minuit en heure locale.
  dateAffichee = new Date(selectedDateString + 'T00:00:00')

  updateUI()

  // --- Votre logique de mise à jour du solde (conservée intacte) ---
  const soldeALaDate = monPortefeuille.calculerSoldeALaDate(selectedDateString)
  const today = new Date()
  const selectedDateObj = new Date(selectedDateString)
  today.setHours(0, 0, 0, 0)
  selectedDateObj.setHours(0, 0, 0, 0)

  if (selectedDateObj > today) {
    const formattedDate = selectedDateObj.toLocaleDateString('fr-FR')
    soldeMontant.textContent = `${soldeALaDate} € (Prévision au ${formattedDate})`
    ligneTotale.textContent = `Solde (prévision) : ${soldeALaDate} €`
  } else {
    soldeMontant.textContent = `${soldeALaDate} €`
    ligneTotale.textContent = `Solde : ${soldeALaDate} €`
  }
})

prevMonthBtn.addEventListener('click', () => {
  dateAffichee.setMonth(dateAffichee.getMonth() - 1)
  updateUI()
})
nextMonthBtn.addEventListener('click', () => {
  dateAffichee.setMonth(dateAffichee.getMonth() + 1)
  updateUI()
})
document.addEventListener('click', (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type === 'date') {
    e.target.showPicker()
  }
})
