import { Transaction, BudgetManager } from './budget.js'

const entrees = document.querySelector('#entrees')
const addE = document.querySelector('#addE')
const addS = document.querySelector('#addS')

const listEntry = document.querySelector('#listEntry')
const listSpending = document.querySelector('#listSpending')
const soldeMontant = document.querySelector('#soldeMontant')
const dateInput = document.querySelector('#datePicker')
const monPortefeuille = new BudgetManager()

// --- État de l'application ---
let dateAffichee = new Date() // La "source de vérité" pour le mois affiché

monPortefeuille.chargerTransactions()
updateUI()

function createFormInput(index, type, element) {
  // On rend la fonction plus intelligente : si un formulaire existe déjà, on ne fait rien.
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

    const transaction = new Transaction(nom, montant, type, date)
    transaction.statut = statut

    monPortefeuille.ajouterTransaction(transaction)

    updateUI()
  })
}

addE.addEventListener('click', () => {
  // On utilise la longueur actuelle pour un index unique, même si ce n'est plus critique
  const listEntryLength = listEntry.children.length
  createFormInput(listEntryLength, 'entree', listEntry) // La fonction vérifiera si un form existe déjà
})
addS.addEventListener('click', () => {
  const listSpendingLength = listSpending.children.length
  createFormInput(listSpendingLength, 'depense', listSpending)
})

function updateUI() {
  // On utilise la date de l'état pour filtrer
  const transactionsDuMois = monPortefeuille.filtrerParDate(dateAffichee)
  const entreeTransactions = transactionsDuMois.filter((t) => t.type === 'entree')
  const depenseTransactions = transactionsDuMois.filter((t) => t.type === 'depense')

  const colEntrees = document.querySelector('#col-entrees')
  const colDepenses = document.querySelector('#col-depenses')
  if (colDepenses && colEntrees) {
    document.querySelectorAll('.ligne-griffon').forEach((ligne) => {
      ligne.remove()
    })
    monPortefeuille.transactions.forEach((transaction) => {
      updateGriffonColonne(transaction.type, transaction.montant, transaction.getDateFormatee())
    })
  }

  afficherTransactions(entreeTransactions, listEntry, transactionsDuMois)
  afficherTransactions(depenseTransactions, listSpending, transactionsDuMois)

  // Logique pour afficher le formulaire si une liste est vide
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

  // --- Logique pour le bilan mensuel dans la totalBox ---
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
  // Logique pour afficher le formulaire si une liste est vide
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
      const recurrence = parentElement.querySelector(`#recurrence-${index}`).checked
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

dateInput.addEventListener('change', () => {
  const selectedDateString = dateInput.value
  const ligneTotale = document.querySelector('#ligne-totale')

  // Si la date est effacée, on revient au solde du jour
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
  dateAffichee = new Date(selectedDateString)
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
