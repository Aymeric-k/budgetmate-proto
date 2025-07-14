class Transaction {
  constructor(nom, montant, type, date, statut, recurrence = null, dateDeFin = null) {
    this.nom = nom
    this.montant = montant
    this.type = type
    this.recurrence = recurrence
    this.dateDeFin = dateDeFin
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
          transactionBrut.statut,
          transactionBrut.recurrence,
          transactionBrut.dateDeFin
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
      if (transactionExistante.recurrence) {
        let dayBefore = new Date(nouvellesDonnees.date)
        dayBefore.setDate(dayBefore.getDate() - 1)
        transactionExistante.dateDeFin = dayBefore
        const newTransaction = new Transaction(
          nouvellesDonnees.nom,
          nouvellesDonnees.montant,
          transactionExistante.type,
          nouvellesDonnees.date,
          'prévu',
          nouvellesDonnees.recurrence
        )
        this.ajouterTransaction(newTransaction)
      } else {
        Object.assign(transactionExistante, nouvellesDonnees)
      }
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
    premierJourDuMois.setHours(0, 0, 0, 0)

    const dernierJourDuMois = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    dernierJourDuMois.setHours(23, 59, 59, 999)

    const transactionsAffichees = []

    const transactionsSimples = this.transactions.filter((transaction) => {
      return (
        !transaction.recurrence &&
        transaction.date >= premierJourDuMois &&
        transaction.date <= dernierJourDuMois
      )
    })

    transactionsAffichees.push(...transactionsSimples)

    const transactionRegles = this.transactions.filter((t) => t.recurrence)

    transactionRegles.forEach((regle) => {
      if (
        regle.date > dernierJourDuMois ||
        (regle.dateDeFin && new Date(regle.dateDeFin) < premierJourDuMois)
      ) {
        return
      }
      if (regle.recurrence === 'mensuel') {
        // --- LOGIQUE DE DATE ROBUSTE ---
        // On récupère le jour de la règle originale (ex: le 15, le 31...).
        const jourDeLaRegle = regle.date.getDate()

        // On trouve le dernier jour du mois que l'on veut afficher.
        const dernierJourDuMoisAffiche = new Date(
          date.getFullYear(),
          date.getMonth() + 1,
          0
        ).getDate()

        // On crée la date de l'instance pour le mois affiché, en s'assurant de ne pas dépasser la fin du mois.
        // Ex: Si la règle est le 31 et qu'on est en février, Math.min(31, 28) donnera 28.
        const dateInstance = new Date(
          date.getFullYear(),
          date.getMonth(),
          Math.min(jourDeLaRegle, dernierJourDuMoisAffiche)
        )
        dateInstance.setHours(
          regle.date.getHours(),
          regle.date.getMinutes(),
          regle.date.getSeconds()
        )

        if (
          dateInstance >= regle.date &&
          dateInstance <= dernierJourDuMois && // S'assurer que l'instance est bien dans le mois courant
          (!regle.dateDeFin || dateInstance <= new Date(regle.dateDeFin))
        ) {
          const instance = new Transaction(
            regle.nom,
            regle.montant,
            regle.type,
            dateInstance,
            regle.statut,
            regle.recurrence,
            regle.dateDeFin
          )
          instance.isGenerated = true
          instance.originalRuleIndex = this.transactions.indexOf(regle)
          transactionsAffichees.push(instance)
        }
      }
    })
    return transactionsAffichees.sort((a, b) => a.date - b.date)
  }
  calculerSoldeALaDate(date) {
    let solde = 0.0
    const dateFinCalcul = new Date(date)
    dateFinCalcul.setHours(23, 59, 59, 999) // On inclut toute la journée

    // Transactions simple
    this.transactions.forEach((transaction) => {
      if (!transaction.recurrence && transaction.date <= dateFinCalcul) {
        solde += transaction.type === 'entree' ? transaction.montant : -transaction.montant
      }
    })

    // TransactionsRécurrentes
    const transactionsRegles = this.transactions.filter((t) => t.recurrence)

    transactionsRegles.forEach((regle) => {
      let dateInstance = new Date(regle.date)

      while (dateInstance <= dateFinCalcul) {
        if (
          dateInstance >= regle.date &&
          (!regle.dateDeFin || dateInstance <= new Date(regle.dateDeFin))
        ) {
          solde += regle.type === 'entree' ? regle.montant : -regle.montant
        }

        if (regle.recurrence === 'mensuel') {
          // Logique robuste pour passer au mois suivant
          const currentDay = dateInstance.getDate()
          // On se place au premier jour du mois suivant pour éviter les "sauts" de mois
          dateInstance.setMonth(dateInstance.getMonth() + 2, 0) // Le "jour 0" du mois M+2 est le dernier jour du mois M+1
          // On essaie de remettre le jour original, sans dépasser le nombre de jours du nouveau mois
          const lastDayOfNextMonth = dateInstance.getDate()
          dateInstance.setDate(Math.min(currentDay, lastDayOfNextMonth))
        } else {
          break
        }
      }
    })
    return solde
  }
}
export { Transaction, BudgetManager }
