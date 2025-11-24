// 메모리 기반 메시지 데이터 모델
class MessageMemory {
  static messages = [];
  static nextId = 1;

  static async getAll() {
    try {
      return Promise.resolve([...this.messages].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
    } catch (error) {
      throw error;
    }
  }

  static async getById(id) {
    try {
      const message = this.messages.find(m => m.id === parseInt(id));
      return Promise.resolve(message);
    } catch (error) {
      throw error;
    }
  }

  static async create(messageData) {
    const {
      sender,
      senderIcon,
      message,
      branch
    } = messageData;

    try {
      const newMessage = {
        id: this.nextId++,
        sender,
        senderIcon,
        message,
        branch,
        timestamp: new Date().toISOString(),
        created_at: new Date(),
        updated_at: new Date()
      };

      this.messages.push(newMessage);
      return Promise.resolve(newMessage);
    } catch (error) {
      throw error;
    }
  }

  static async delete(id) {
    try {
      const messageIndex = this.messages.findIndex(m => m.id === parseInt(id));
      if (messageIndex === -1) {
        return Promise.resolve(null);
      }

      const deletedMessage = this.messages[messageIndex];
      this.messages.splice(messageIndex, 1);
      return Promise.resolve(deletedMessage);
    } catch (error) {
      throw error;
    }
  }

  static clearAllData() {    this.messages = [];
    this.nextId = 1;
  }
}

module.exports = MessageMemory;
