/* eslint-disable max-len */
/* eslint-disable require-jsdoc */
const {Pool} = require('pg');
const InvariantError = require('../../exceptions/InvariantError');
const {nanoid} = require('nanoid');
const NotFoundError = require('../../exceptions/NotFoundError');

class PlaylistSongService {
  constructor() {
    this._pool = new Pool();
  }

  async addPlaylistsong(playlistId, songId) {
    const id = `playlistsongs-${nanoid(16)}`;
    const query = {
      text: 'INSERT INTO playlistsongs VALUES($1, $2, $3) RETURNING id',
      values: [id, playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new InvariantError('Lagu gagal ditambahkan ke playlist');
    }
    return result.rows[0].id;
  }

  async getSongFromPlaylist(playlistId) {
    const query = {
      text: `SELECT songs.id, songs.title, songs.performer FROM songs
            LEFT JOIN playlistsongs ON playlistsongs.song_id = songs.id
            WHERE playlistsongs.playlist_id = $1`,
      values: [playlistId],
    };

    const result = await this._pool.query(query);
    return result.rows;
  }

  async deleteSongFromPlaylistById(playlistId, songId) {
    const query = {
      text: 'DELETE FROM playlistsongs WHERE playlist_id = $2 AND song_id = $1 RETURNING id',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Lagu gagal dihapus dari playlist. Id tidak ditemukan');
    }
  }

  async verifyPlaylistSong(playlistId, songId) {
    const query = {
      text: 'SELECT * FROM playlistsongs WHERE playlist_id = $1 AND song_id = $2',
      values: [playlistId, songId],
    };

    const result = await this._pool.query(query);
    if (!result.rows.length) {
      throw new NotFoundError('Lagu tidak ditemukan di playlist');
    }
  }
}

module.exports = PlaylistSongService;
