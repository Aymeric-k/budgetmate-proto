class Transaction {
  constructor(nom, montant, type, date) {
    this.nom = nom
    this.montant = montant
    this.type = type
    this.date = new Date(date)
  }

  getDateFormatee() {
    return this.date.toLocaleDateString('fr')
  }
}

//Gestionnaire
class BudgetManager {
  constructor() {
    this.transactions = []
  }
  ajouterTransaction(transaction) {
    this.transactions.push(transaction)
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
}

const monPortefeuille = new BudgetManager()

export { Transaction, BudgetManager }
