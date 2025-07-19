import { Transaction, BudgetManager } from './budget.js'

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

/**
 * Affiche un formulaire pour ajouter une nouvelle transaction.
 * @param {'entree' | 'depense'} type Le type de transaction à ajouter.
 */
function showTransactionForm(type) {
  const isEntry = type === 'entree'
  const container = isEntry ? listEntry : listSpending
  const buttonToHide = isEntry ? addE : addS

  // Vérifie si un formulaire pour cette section est déjà ouvert.
  if (
    container.nextElementSibling &&
    container.nextElementSibling.classList.contains('transaction-form')
  ) {
    console.warn(`Le formulaire pour '${type}' est déjà ouvert.`)
    container.nextElementSibling.querySelector('input').focus() // Met le focus sur le formulaire existant
    return
  }

  buttonToHide.style.display = 'none'

  const form = document.createElement('form')
  form.className = 'transaction-form'
  form.noValidate = true

  form.innerHTML = `
    <fieldset>
        <label for="nom-new">Nom de la transaction</label>
        <input type="text" name="nom" id="nom-new" placeholder="Ex: Salaire, Courses..." required>
    </fieldset>
    <fieldset>
        <label for="montant-new">Montant</label>
        <input type="number" name="montant" id="montant-new" placeholder="Montant exact" required step="0.01">
    </fieldset>
    <fieldset>
        <label for="dateAction-new">Date</label>
        <input type="date" name="dateAction" id="dateAction-new" value="${formatDateForInput(
          new Date()
        )}" required>
    </fieldset>
    <fieldset>
        <label for="recurrence-new">Récurrent ?</label>
        <input type="checkbox" id="recurrence-new" name="recurrence">
    </fieldset>
    <fieldset id="frequenceContainer-new"></fieldset>
    <div class="form-actions">
        <button type="submit" class="add">Ajouter</button>
        <button type="button" class="cancel-btn">Annuler</button>
    </div>
  `

  const recurrenceCheckbox = form.querySelector(`#recurrence-new`)
  const frequenceContainer = form.querySelector(`#frequenceContainer-new`)
  recurrenceCheckbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      frequenceContainer.innerHTML = `
          <label for="frequence-new">Fréquence</label>
          <select name="frequence" id="frequence-new">
              <option value="mensuel">Chaque mois</option>
              <option value="hebdo">Chaque semaine</option>
              <option value="annuel">Chaque année</option>
          </select>
      `
    } else {
      frequenceContainer.innerHTML = ''
    }
  })

  const closeForm = () => {
    form.remove()
    buttonToHide.style.display = ''
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const nom = form.querySelector(`#nom-new`).value.trim()
    const montant = Number(form.querySelector(`#montant-new`).value)
    const date = form.querySelector(`#dateAction-new`).value

    if (!nom || !montant || !date) {
      showNotification('Merci de remplir les champs nom, montant et date.', 'error')
      return
    }

    const statut = getStatutFromDate(date)
    let recurrenceData = null
    const frequenceSelect = form.querySelector(`#frequence-new`)
    if (frequenceSelect) {
      recurrenceData = frequenceSelect.value
    }

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
    showNotification(message, type)

    closeForm() // On ferme le formulaire après l'ajout.
    updateUI() // On met à jour l'interface.
  })

  // Gestion de l'annulation.
  const cancelButton = form.querySelector('.cancel-btn')
  cancelButton.addEventListener('click', closeForm)

  // On ajoute le formulaire au DOM, après la liste correspondante.
  container.insertAdjacentElement('afterend', form)
  form.querySelector('#nom-new').focus()
}

function showNotification(message, type) {
  const notificationContainer = document.querySelector('#notification-container')
  if (!notificationContainer) {
    console.error("Le conteneur de notifications #notification-container n'a pas été trouvé.")
    return
  }

  const notification = document.createElement('div')
  notification.classList.add('notification', type)
  notification.textContent = message
  notificationContainer.appendChild(notification)

  setTimeout(() => notification.classList.add('show'), 10)

  setTimeout(() => {
    notification.classList.remove('show')

    notification.addEventListener('transitionend', () => notification.remove())
  }, 4000)
}

addE.addEventListener('click', () => showTransactionForm('entree'))
addS.addEventListener('click', () => showTransactionForm('depense'))

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
      editBtn.setAttribute('aria-label', 'Modifier la transaction')
      editBtn.textContent = '✏️'
      editBtn.dataset.index = globalIndex
      btnContainer.appendChild(editBtn)

      const deleteBtn = document.createElement('button')
      deleteBtn.className = 'delete-btn post-it-btn'
      deleteBtn.setAttribute('aria-label', 'Supprimer la transaction')
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

  dateAffichee = new Date(selectedDateString + 'T00:00:00')

  updateUI()

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
