import { Transaction, BudgetManager } from './budget.js'

const entrees = document.querySelector('#entrees')
const addE = document.querySelector('#addE')
const addS = document.querySelector('#addS')
const validateE = document.querySelector('#validateE')
const addElementForm = document.querySelector('#addElement')
const listEntry = document.querySelector('#listEntry')
const listSpending = document.querySelector('#listSpending')

const monPortefeuille = new BudgetManager()

const transactions = []

// function transformInputIntoP(element,value, index){
//     const p = document.createElement('p');
//     p.dataset.index = index;
//     p.classList.add('writing','entree');
//     p.textContent= value;

//     element.parentNode.replaceChild(p,element);

// }
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
      <button type="button">Ajouter</button>
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
    updateGriffonColonne(type, montant)

    const entreeTransactions = monPortefeuille.filtrerParType('entree')
    const depenseTransactions = monPortefeuille.filtrerParType('depense')
    afficherDepense(depenseTransactions)
    afficherEntree(entreeTransactions)
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

// listEntry.addEventListener('keydown', (e) => {
//   if (e.target.classList.contains('transaction') && e.key === 'Enter') {
//     let addForm = e.target.closest('form')
//     let dateTransaction = addForm.querySelector('[name="dateAction"]').value
//     let statut = getStatutFromDate(dateTransaction)
//     let nomTransaction = addForm.querySelector('#nom').value
//     let montantTransaction = Number(addForm.querySelector('#montant').value)

//     let type = document.querySelector('#montant').dataset.type
//     let index = document.querySelector('#montant').dataset.index

//     transactions[index] = new Transaction(nomTransaction, montantTransaction, type)
//     transactions[index].statut = statut
//     monPortefeuille.ajouterTransaction(transactions[index])
//     let entreeTransactions = monPortefeuille.filtrerParType('entree')
//     afficherEntree(entreeTransactions)
//     addForm.reset()
//   }
// })

const afficherEntree = (entrees) => {
  listEntry.innerHTML = ''
  entrees.forEach((entree) => {
    let ligne = `<div class ="post-it entree">`
    Object.keys(entree).forEach((key) => {
      ligne += ` <p><span class="bold">${key}</span> : `
      if (key === 'date') {
        ligne += ` ${entree.getDateFormatee()}  </p>`
      } else if (key === 'statut') {
        ligne += ` ${entree[key] === 'prévu' ? 'prévu ⏳' : 'réalisé ✅'} </p>`
      } else {
        ligne += ` ${entree[key]}</p>  `
      }
    })
    ligne += `</div>`
    listEntry.innerHTML += ligne
  })
}
const afficherDepense = (depenses) => {
  listSpending.innerHTML = ''

  depenses.forEach((depense) => {
    let ligne = `<div class= "post-it depense">`
    Object.keys(depense).forEach((key) => {
      ligne += ` <p><span class="bold">${key}</span> : `
      if (key === 'date') {
        ligne += ` ${depense.getDateFormatee()}  </p>`
      } else if (key === 'statut') {
        ligne += ` ${depense[key] === 'prévu' ? 'prévu ⏳' : 'réalisé ✅'} </p>`
      } else {
        ligne += ` ${depense[key]}</p>  `
      }
    })
    ligne += `</div>`
    listSpending.innerHTML += ligne
  })
}

function getStatutFromDate(dateString) {
  const today = new Date()
  const dateInput = new Date(dateString)

  // On normalise les dates (sans l'heure)
  today.setHours(0, 0, 0, 0)
  dateInput.setHours(0, 0, 0, 0)

  return dateInput > today ? 'prévu' : 'réalisé'
}
function updateGriffonColonne(type, montant) {
  const ligne = document.createElement('div')
  ligne.className = 'ligne-griffon'
  ligne.textContent = `${type === 'entree' ? '+ ' : '- '}${montant} €`
  document.querySelector(`#col-${type === 'entree' ? 'entrees' : 'depenses'}`).appendChild(ligne)
}
