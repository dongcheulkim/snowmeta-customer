// 메모리 기반 Ambassador 모델 (개발용)
class AmbassadorMemory {
  constructor() {
    this.ambassadors = [];
    this.nextId = 1;
  }

  async getAll() {
    return [...this.ambassadors].sort((a, b) =>
      new Date(b.created_at) - new Date(a.created_at)
    );
  }

  async getById(id) {
    return this.ambassadors.find(ambassador => ambassador.id === parseInt(id));
  }

  async create(ambassadorData) {
    const newAmbassador = {
      id: this.nextId++,
      ...ambassadorData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    this.ambassadors.push(newAmbassador);
    return newAmbassador;
  }

  async update(id, ambassadorData) {
    const index = this.ambassadors.findIndex(ambassador => ambassador.id === parseInt(id));
    if (index === -1) return null;

    this.ambassadors[index] = {
      ...this.ambassadors[index],
      ...ambassadorData,
      updated_at: new Date().toISOString()
    };

    return this.ambassadors[index];
  }

  async delete(id) {
    const index = this.ambassadors.findIndex(ambassador => ambassador.id === parseInt(id));
    if (index === -1) return null;

    const deletedAmbassador = this.ambassadors[index];
    this.ambassadors.splice(index, 1);
    return deletedAmbassador;
  }

  async findByCustomerPhone(phone) {
    return this.ambassadors.filter(ambassador => ambassador.customer_phone === phone);
  }

  clearAllData() {
    this.ambassadors = [];
    this.nextId = 1;  }
}

module.exports = new AmbassadorMemory();