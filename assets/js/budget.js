class Transaction {
  constructor(nom, montant, type, date, recurrence) {
    this.nom = nom
    this.montant = montant
    this.type = type
    this.recurrence = recurrence
    this.date = new Date(date)
  }

  getDateFormatee() {
    return this.date.toLocaleDateString('fr', { day: 'numeric', month: 'short', year: 'numeric' })
  }
}

//Gestionnaire
class BudgetManager {
  constructor() {
    this.transactions = []
  }
  initialiserTransactions(transactions) {
    this.transactions = transactions
  }
  ajouterTransaction(transaction) {
    this.transactions.push(transaction)
  }
  supprimerTransaction(index) {
    this.transactions.splice(index, 1)
  }
  modifierTransaction(index, nouvellesDonnees) {
    const transactionExistante = this.transactions[index]
    if (transactionExistante) {
      Object.assign(transactionExistante, nouvellesDonnees)
    }
  }
  calculerSolde() {
    let solde = 0
    this.transactions.forEach((transaction) => {
      transaction.type === 'entree'
        ? (solde += transaction.montant)
        : (solde -= transaction.montant)
    })
    return solde
  }
  filtrerParType(type) {
    return this.transactions.filter((transaction) => transaction.type === type)
  }
  calculerSoldeALaDate(date) {
    let solde = 0
    const dateReference = new Date(date) // Convertit la date en objet Date pour comparaison

    this.transactions.forEach((transaction) => {
      // Inclure seulement les transactions avant ou à la date de référence
      if (transaction.date <= dateReference) {
        transaction.type === 'entree'
          ? (solde += transaction.montant)
          : (solde -= transaction.montant)
      }
    })
    return solde
  }
}

const monPortefeuille = new BudgetManager()

export { Transaction, BudgetManager }
