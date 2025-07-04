import { Transaction, BudgetManager } from './budget.js'

const entrees = document.querySelector('#entrees')
const addE = document.querySelector('#addE')
const addS = document.querySelector('#addS')

const listEntry = document.querySelector('#listEntry')
const listSpending = document.querySelector('#listSpending')
const soldeMontant = document.querySelector('#soldeMontant')
const dateInput = document.querySelector('#datePicker')
const monPortefeuille = new BudgetManager()

function saveTransactionsToLocalStorage() {
  localStorage.setItem('transactions', JSON.stringify(monPortefeuille.transactions))
}

let listEntryLength = listEntry.children.length
let listSpendingLength = listSpending.children.length

function createFormInput(index, type, element) {
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
    console.log('test')
    const nom = currentForm.querySelector(`[id^=nom]`).value.trim()
    const montant = Number(currentForm.querySelector(`[id^=montant]`).value)
    const date = currentForm.querySelector(`[id^=dateAction]`).value
    const type = currentForm.querySelector(`[id^=montant]`).dataset.type
    if (!nom || !montant || !date) {
      alert('Merci de remplir au minimum les champs nom, montant et date.')
      return
    }

    const statut = getStatutFromDate(date)

    const transaction = new Transaction(nom, montant, type, date)
    transaction.statut = statut

    monPortefeuille.ajouterTransaction(transaction)
    updateGriffonColonne(type, montant, date)

    const entreeTransactions = monPortefeuille.filtrerParType('entree')
    const depenseTransactions = monPortefeuille.filtrerParType('depense')
    afficherTransactions(entreeTransactions, listEntry)
    afficherTransactions(depenseTransactions, listSpending)
    const soldeDisponible = monPortefeuille.calculerSoldeALaDate(new Date())
    const formattedDate = new Date().toLocaleDateString('fr-FR')
    const ligneTotale = document.querySelector('#ligne-totale')
    soldeMontant.textContent = `${soldeDisponible} € (Au ${formattedDate})`
    ligneTotale.textContent = `Solde : ${soldeDisponible} € (Au ${formattedDate})`
    updateUI()
  })
}
createFormInput(listEntryLength, 'entree', listEntry)

addE.addEventListener('click', () => {
  createFormInput(listEntryLength, 'entree', listEntry)
})
addS.addEventListener('click', () => {
  createFormInput(listSpendingLength, 'depense', listSpending)
})

function updateUI() {
  const entreeTransactions = monPortefeuille.filtrerParType('entree')
  const depenseTransactions = monPortefeuille.filtrerParType('depense')
  afficherTransactions(entreeTransactions, listEntry)
  afficherTransactions(depenseTransactions, listSpending)

  const soldeDisponible = monPortefeuille.calculerSoldeALaDate(new Date())
  const formattedDate = new Date().toLocaleDateString('fr-FR')
  const ligneTotale = document.querySelector('#ligne-totale')
  soldeMontant.textContent = `${soldeDisponible} € (Au ${formattedDate})`
  ligneTotale.textContent = `Solde : ${soldeDisponible} € (Au ${formattedDate})`
}

function afficherTransactions(transactions, containerElement) {
  containerElement.innerHTML = ''
  const fragment = document.createDocumentFragment()
  transactions.forEach((transaction, index) => {
    const postItDiv = document.createElement('div')
    const postItClass = transaction.type === 'entree' ? 'entree' : 'depense'
    postItDiv.className = `post-it ${postItClass}`
    const btnContainer = document.createElement('div')
    btnContainer.className = 'btn-container'
    postItDiv.appendChild(btnContainer)
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
    const proprietesACacher = ['recurrence']

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
    const transaction = monPortefeuille.transactions[index]
    const inputDateValue = formatDateForInput(transaction.date)

    // parentElement.classList.remove('post-it', transaction.type)
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
      <input type="checkbox" id="recurrence-${index}" name="recurrence" value="${
      transaction.recurrence
    }">
    </fieldset>
      <fieldset id="frequenceContainer-${index}"></fieldset>
      <fieldset class="edit-buttons">
        <button type="button" class="cancel-btn">❌</button>
        <button type="button" class="save-btn">✔️</button>
      </fieldset>
    `
    const cancelBtn = parentElement.querySelector('.cancel-btn')
    cancelBtn.addEventListener('click', () => {
      updateUI()
    })
    const saveBtn = parentElement.querySelector('.save-btn')
    saveBtn.addEventListener('click', () => {
      const nom = parentElement.querySelector(`#nom-${index}`).value.trim()
      const montant = Number(parentElement.querySelector(`#montant-${index}`).value)
      const date = parentElement.querySelector(`#dateAction-${index}`).value
      const recurrence = parentElement.querySelector(`#recurrence-${index}`)
      const datePourMAJ = new Date(date)

      const nouvellesDonnes = {
        nom: nom,
        montant: montant,
        date: datePourMAJ,
        recurrence: recurrence,
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
  }${montant} € <span id ="griffon-date">(${date})</span></p>`
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

dateInput.addEventListener('change', () => {
  const selectedDate = dateInput.value
  const ligneTotale = document.querySelector('#ligne-totale')

  // Si la date est effacée, on revient au solde du jour
  if (!selectedDate) {
    const soldeActuel = monPortefeuille.calculerSoldeALaDate(new Date())
    soldeMontant.textContent = `${soldeActuel} €`
    if (ligneTotale) {
      ligneTotale.textContent = `Solde : ${soldeActuel} €`
    }
    return
  }

  const soldeALaDate = monPortefeuille.calculerSoldeALaDate(selectedDate)
  const today = new Date()
  const selectedDateObj = new Date(selectedDate)
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
