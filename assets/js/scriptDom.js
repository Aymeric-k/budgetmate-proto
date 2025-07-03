import { Transaction, BudgetManager } from './budget.js'

const entrees = document.querySelector('#entrees')
const addE = document.querySelector('#addE')
const addS = document.querySelector('#addS')

const listEntry = document.querySelector('#listEntry')
const listSpending = document.querySelector('#listSpending')
const soldeMontant = document.querySelector('#soldeMontant')
const dateInput = document.querySelector('#datePicker')
const monPortefeuille = new BudgetManager()

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
        <input type="checkbox" id="recurrence-${index}" name="recurrence">
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
  })
}
createFormInput(listEntryLength, 'entree', listEntry)

addE.addEventListener('click', () => {
  createFormInput(listEntryLength, 'entree', listEntry)
})
addS.addEventListener('click', () => {
  createFormInput(listSpendingLength, 'depense', listSpending)
})

const newTransaction = document.querySelector('.transaction')

function afficherTransactions(transactions, containerElement) {
  containerElement.innerHTML = ''
  transactions.forEach((transaction) => {
    const postItClass = transaction.type === 'entree' ? 'entree' : 'depense'
    let ligne = `<div class="post-it ${postItClass}">`
    Object.keys(transaction).forEach((key) => {
      ligne += ` <p><span class="bold">${key}</span> : `
      if (key === 'date') {
        ligne += ` ${transaction.getDateFormatee()}  </p>`
      } else if (key === 'statut') {
        ligne += ` ${transaction[key] === 'prévu' ? 'prévu ⏳' : 'réalisé ✅'} </p>`
      } else {
        ligne += ` ${transaction[key]}</p>  `
      }
    })
    ligne += `</div>`
    containerElement.innerHTML += ligne
  })
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
