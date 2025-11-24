const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

const userController = {
  // 로그인
  async login(req, res) {
    try {
      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          error: '사용자명과 비밀번호를 입력해주세요.'
        });
      }

      const user = await User.authenticate(username, password);

      if (!user) {
        return res.status(401).json({
          error: '사용자명 또는 비밀번호가 올바르지 않습니다.'
        });
      }

      // JWT 토큰 생성
      const token = generateToken(user);

      res.json({
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          branchName: user.branch_name,
          isAdmin: user.is_admin === 1
        }
      });
    } catch (error) {
      console.error('로그인 오류:', error);
      res.status(500).json({ error: '로그인에 실패했습니다.' });
    }
  },

  // 모든 사용자 조회 (관리자 전용)
  getAllUsers(req, res) {
    try {
      const users = User.getAll();
      res.json(users);
    } catch (error) {
      console.error('사용자 목록 조회 오류:', error);
      res.status(500).json({ error: '사용자 목록을 가져오는데 실패했습니다.' });
    }
  },

  // 사용자 정보 조회
  getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = User.getById(id);

      if (!user) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      res.json(user);
    } catch (error) {
      console.error('사용자 조회 오류:', error);
      res.status(500).json({ error: '사용자 정보를 가져오는데 실패했습니다.' });
    }
  },

  // 사용자 생성 (관리자 전용)
  async createUser(req, res) {
    try {
      const { username, password, branch_name, is_admin } = req.body;

      if (!username || !password || !branch_name) {
        return res.status(400).json({
          error: '사용자명, 비밀번호, 지점명은 필수입니다.'
        });
      }

      const newUser = await User.create({
        username,
        password,
        branch_name,
        is_admin: is_admin || false
      });

      res.status(201).json(newUser);
    } catch (error) {
      console.error('사용자 생성 오류:', error);
      if (error.message.includes('UNIQUE')) {
        return res.status(400).json({ error: '이미 존재하는 사용자명입니다.' });
      }
      res.status(500).json({ error: '사용자 생성에 실패했습니다.' });
    }
  },

  // 비밀번호 변경
  async updatePassword(req, res) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword) {
        return res.status(400).json({
          error: '새로운 비밀번호를 입력해주세요.'
        });
      }

      const user = User.getById(id);
      if (!user) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      const updatedUser = await User.updatePassword(id, newPassword);
      res.json({
        success: true,
        message: '비밀번호가 성공적으로 변경되었습니다.',
        user: updatedUser
      });
    } catch (error) {
      console.error('비밀번호 변경 오류:', error);
      res.status(500).json({ error: '비밀번호 변경에 실패했습니다.' });
    }
  },

  // 사용자 정보 수정 (관리자 전용)
  updateUser(req, res) {
    try {
      const { id } = req.params;
      const { username, branch_name, is_admin } = req.body;

      const existingUser = User.getById(id);
      if (!existingUser) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      const updatedUser = User.update(id, {
        username: username || existingUser.username,
        branch_name: branch_name || existingUser.branch_name,
        is_admin: is_admin !== undefined ? is_admin : existingUser.is_admin
      });

      res.json(updatedUser);
    } catch (error) {
      console.error('사용자 수정 오류:', error);
      res.status(500).json({ error: '사용자 수정에 실패했습니다.' });
    }
  },

  // 사용자 삭제 (관리자 전용)
  deleteUser(req, res) {
    try {
      const { id } = req.params;
      const deletedUser = User.delete(id);

      if (!deletedUser) {
        return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
      }

      res.json({ message: '사용자가 성공적으로 삭제되었습니다.' });
    } catch (error) {
      console.error('사용자 삭제 오류:', error);
      res.status(500).json({ error: '사용자 삭제에 실패했습니다.' });
    }
  }
};

module.exports = userController;
