/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {Pool} = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const {nanoid} = require('nanoid');

class UsersAlbumLikes {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addLikeAlbum(userId, albumId) {
    await this.verifyAlbumExist(albumId);
    await this.verifyLikeAlbum(userId, albumId);
    const id = `like-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO user_album_likes VALUES($1, $2, $3) RETURNING id',
      values: [id, userId, albumId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Gagal menambahkan like album');
    }
    await this._cacheService.delete(`albumlike:${albumId}`);
    return result.rows[0].id;
  }

  async verifyLikeAlbum(userId, albumId) {
    const query = {
      text: 'SELECT * FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);
    if (result.rows.length > 0) {
      throw new InvariantError('Gagal menambahkan like album. Like sudah ada');
    }
  }

  async verifyAlbumExist(albumId) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [albumId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Gagal menambahkan like album. Id album tidak ditemukan');
    }
  }

  async getLikeAlbum(albumId) {
    try {
      const result = await this._cacheService.get(`albumlike:${albumId}`);
      return {
        source: 'cache',
        like: parseInt(result, 10),
      };
    } catch (error) {
      const query = {
        text: 'SELECT COUNT(*) AS like FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };
      const result = await this._pool.query(query);
      await this._cacheService.set(`albumlike:${albumId}`, result.rows[0].like);
      return {
        source: 'database',
        like: parseInt(result.rows[0].like, 10),
      };
    }
  }

  async deleteLikeAlbum(userId, albumId) {
    const query = {
      text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2 RETURNING id',
      values: [userId, albumId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Gagal menghapus like album. Id tidak ditemukan');
    }
    await this._cacheService.delete(`albumlike:${albumId}`);
  }
}

module.exports = UsersAlbumLikes;
