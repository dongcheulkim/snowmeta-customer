const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

// Supabase 클라이언트 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://cdboaczqtigxpzgahizy.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkYm9hY3pxdGlneHB6Z2FoaXp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwMzk1ODgsImV4cCI6MjA3NjYxNTU4OH0.S1QoxWiU2hQEDuMLOT7VzO0koSpo8mHxfCXS1bWFPCw';

const supabase = createClient(supabaseUrl, supabaseKey);

class User {
  // 사용자 인증 (로그인)
  static async authenticate(username, password) {
    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .single();

      if (error || !user) {
        return null;
      }

      // bcrypt로 비밀번호 비교
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return null;
      }

      // 비밀번호 제외하고 반환
      const { password: _, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      throw error;
    }
  }

  // 모든 사용자 조회
  static async getAll() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, branch_name, is_admin, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // ID로 사용자 조회
  static async getById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, branch_name, is_admin, created_at, updated_at')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // 사용자명으로 조회
  static async getByUsername(username) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, branch_name, is_admin, created_at, updated_at')
        .eq('username', username)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // 새 사용자 생성
  static async create(userData) {
    try {
      const { username, password, branch_name, is_admin } = userData;

      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from('users')
        .insert([{
          username,
          password: hashedPassword,
          branch_name,
          is_admin: is_admin || false
        }])
        .select('id, username, branch_name, is_admin, created_at')
        .single();

      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          throw new Error('이미 존재하는 사용자명입니다.');
        }
        throw error;
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 정보 업데이트
  static async update(id, userData) {
    try {
      const { username, branch_name, is_admin } = userData;

      const { data, error } = await supabase
        .from('users')
        .update({
          username,
          branch_name,
          is_admin,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, username, branch_name, is_admin, created_at, updated_at')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // 비밀번호 변경
  static async updatePassword(id, newPassword) {
    try {
      // 비밀번호 해싱
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      const { data, error } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('id, username, branch_name, is_admin')
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      throw error;
    }
  }

  // 사용자 삭제
  static async delete(id) {
    try {
      const user = await this.getById(id);

      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = User;
