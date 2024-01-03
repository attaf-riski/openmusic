/* eslint-disable max-len */
/* eslint-disable camelcase */

exports.up = (pgm) => {
  // membuat album kosong untuk lagu yang tidak butuh album
  pgm.sql(`INSERT INTO albums(id, name, year, created_at, updated_at) VALUES ('album_kosong', 'album_kosong', 0, '27-11-1900', '27-11-1900');`);

  // update song dengan album kosong menjadi album_kosong
  pgm.sql(`UPDATE songs SET album_id = 'album_kosong' WHERE album_id IS NULL;`);

  // memberikan constraint foreign key pada kolom album_id
  pgm.addConstraint('songs', 'fk_songs.album_id_albums.id', 'FOREIGN KEY(album_id) REFERENCES albums(id) ON DELETE CASCADE');
};

exports.down = (pgm) => {
  // menghapus constraint fk_songs.album_id_albums.id pada tabel songs
  pgm.dropConstraint('songs', 'fk_songs.album_id_albums.id');

  // mengubah nilai album_id yang album_kosong menjadi NULL
  pgm.sql(`UPDATE songs SET album_id = NULL WHERE album_id = 'album_kosong';`);

  // menghapus album_kosong
  pgm.sql(`DELETE FROM albums WHERE id = 'album_kosong';`);
};
