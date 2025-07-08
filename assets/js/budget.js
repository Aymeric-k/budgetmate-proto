class Transaction {
  constructor(nom, montant, type, date, recurrence, statut) {
    this.nom = nom
    this.montant = montant
    this.type = type
    this.recurrence = recurrence
    this.date = new Date(date)
    this.statut = statut
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
  sauvegarderTransactions() {
    localStorage.setItem('transactions', JSON.stringify(this.transactions))
  }
  chargerTransactions() {
    const donneesATraiter = JSON.parse(localStorage.getItem('transactions'))
    if (donneesATraiter) {
      this.transactions = donneesATraiter.map((transactionBrut) => {
        return new Transaction(
          transactionBrut.nom,
          transactionBrut.montant,
          transactionBrut.type,
          transactionBrut.date,
          transactionBrut.recurrence,
          transactionBrut.statut
        )
      })
    }
  }
  ajouterTransaction(transaction) {
    this.transactions.push(transaction)
    this.sauvegarderTransactions()
  }
  supprimerTransaction(index) {
    this.transactions.splice(index, 1)
    this.sauvegarderTransactions()
  }
  modifierTransaction(index, nouvellesDonnees) {
    const transactionExistante = this.transactions[index]
    if (transactionExistante) {
      Object.assign(transactionExistante, nouvellesDonnees)
    }
    this.sauvegarderTransactions()
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
  filtrerParDate(date = new Date()) {
    const premierJourDuMois = new Date(date.getFullYear(), date.getMonth(), 1)
    premierJourDuMois.setHours(0, 0, 0, 0) // On s'assure de commencer au tout début du jour

    const dernierJourDuMois = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    dernierJourDuMois.setHours(23, 59, 59, 999) // On s'assure de finir à la toute fin du jour

    return this.transactions.filter(
      (transaction) =>
        transaction.date >= premierJourDuMois && transaction.date <= dernierJourDuMois
    )
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
