/* eslint-disable max-len */
const {Pool} = require('pg');
const {nanoid} = require('nanoid');
const InvariantError = require('../../exceptions/InvariantError');
const NotFoundError = require('../../exceptions/NotFoundError');
const {mapSong} = require('../../utils');

/* eslint-disable require-jsdoc */
class SongsService {
  constructor(cacheService) {
    this._pool = new Pool();
    this._cacheService = cacheService;
  }

  async addSong({title, year, performer, genre, duration, albumId}) {
    const id = `song-${nanoid(16)}`;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;

    const query = {
      text: 'INSERT INTO songs VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id',
      values: [id, title, year, performer, genre, duration, albumId, createdAt, updatedAt],
    };

    const result = await this._pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Lagu gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getSongs({title, performer}) {
    try {
      const result = await this._cacheService.get(`songs:${title}:${performer}`);
      return {
        source: 'cache',
        songs: JSON.parse(result),
      };
    } catch (error) {
      if (title === undefined) {
        // eslint-disable-next-line no-param-reassign
        title = '';
      }

      if (performer === undefined) {
        // eslint-disable-next-line no-param-reassign
        performer = '';
      }

      const query = {
        text: 'SELECT id, title, performer FROM songs WHERE lower(title) LIKE $1 AND lower(performer) LIKE $2',
        values: [`%${title.toLowerCase()}%`, `%${performer.toLowerCase()}%`],
      };

      const result = await this._pool.query(query);
      await this._cacheService.set(`songs:${title}:${performer}`, JSON.stringify(result.rows));
      return {
        source: 'database',
        songs: result.rows,
      };
    }
  }

  async getSongById(id) {
    try {
      const result = await this._cacheService.get(`songs:${id}`);
      return {
        source: 'cache',
        song: JSON.parse(result),
      };
    } catch (error) {
      const query = {
        text: 'SELECT id, title, year, performer, genre, duration, album_id FROM songs WHERE id = $1',
        values: [id],
      };
      const result = await this._pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('Lagu tidak ditemukan');
      }

      await this._cacheService.set(`songs:${id}`, JSON.stringify(mapSong(result.rows[0])));
      return {
        source: 'database',
        song: mapSong(result.rows[0]),
      };
    }
  }

  async getSongsByAlbumId(albumId) {
    const query = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id = $1',
      values: [albumId],
    };
    const result = await this._pool.query(query);
    return result.rows;
  }

  async editSongById(id, {title, year, performer, genre, duration, albumId}) {
    const updatedAt = new Date().toISOString();

    const queryForOld = {
      text: 'SELECT title, performer FROM songs WHERE id = $1',
      values: [id],
    };

    const resultQuery = await this._pool.query(queryForOld);

    if (!resultQuery.rows.length) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }

    const query = {
      // eslint-disable-next-line max-len
      text: 'UPDATE songs SET title = $1, year = $2, performer = $3, genre = $4, duration = $5, updated_at = $6, album_id = $7 WHERE id = $8 RETURNING id',
      values: [title, year, performer, genre, duration, updatedAt, albumId, id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui lagu. Id tidak ditemukan');
    }

    const {title: titleOld, performer: performerOld} = resultQuery.rows[0];
    this._cacheService.delete(`songs:${titleOld}:${performerOld}`);
    this._cacheService.delete(`songs:${id}`);
  }

  async deleteSongById(id) {
    const query = {
      text: 'DELETE FROM songs WHERE id = $1 RETURNING id, title, performer',
      values: [id],
    };

    const result = await this._pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus. Id tidak ditemukan');
    }

    const {title, performer} = result.rows[0];

    await this._cacheService.delete(`songs:${id}`);
    await this._cacheService.delete(`songs:${title}:${performer}`);
  }
}

module.exports = SongsService;
