const MessageMemory = require('../models/MessageMemory');

const messageController = {
  async getAllMessages(req, res) {
    try {
      const messages = await MessageMemory.getAll();
      res.json(messages);
    } catch (error) {      res.status(500).json({ error: '메시지 목록을 가져오는데 실패했습니다.' });
    }
  },

  async getMessageById(req, res) {
    try {
      const { id } = req.params;
      const message = await MessageMemory.getById(id);

      if (!message) {
        return res.status(404).json({ error: '메시지를 찾을 수 없습니다.' });
      }

      res.json(message);
    } catch (error) {      res.status(500).json({ error: '메시지 정보를 가져오는데 실패했습니다.' });
    }
  },

  async createMessage(req, res) {
    try {
      const {
        sender,
        senderIcon,
        message,
        branch
      } = req.body;

      if (!sender || !message || !branch) {
        return res.status(400).json({
          error: '발신자, 메시지, 지점은 필수입니다.'
        });
      }

      const newMessage = await MessageMemory.create({
        sender,
        senderIcon,
        message,
        branch
      });

      res.status(201).json(newMessage);
    } catch (error) {      res.status(500).json({ error: '메시지 전송에 실패했습니다.' });
    }
  },

  async deleteMessage(req, res) {
    try {
      const { id } = req.params;
      const deletedMessage = await MessageMemory.delete(id);

      if (!deletedMessage) {
        return res.status(404).json({ error: '메시지를 찾을 수 없습니다.' });
      }

      res.json({ message: '메시지가 성공적으로 삭제되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '메시지 삭제에 실패했습니다.' });
    }
  },

  async clearAllData(req, res) {
    try {
      MessageMemory.clearAllData();
      res.json({ message: '모든 메시지 데이터가 성공적으로 삭제되었습니다.' });
    } catch (error) {      res.status(500).json({ error: '메시지 데이터 삭제에 실패했습니다.' });
    }
  }
};

module.exports = messageController;
