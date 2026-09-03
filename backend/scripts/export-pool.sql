SELECT b.beatmap_id,
       b.beatmapset_id,
       b.difficultyrating,
       CONVERT(b.version USING utf8mb4),
       b.hit_length,
       b.total_length,
       NULLIF(b.max_combo, 0)
FROM osu_beatmaps b
JOIN osu_beatmapsets s ON s.beatmapset_id = b.beatmapset_id
WHERE b.playmode = 0
  AND b.approved IN (1, 2)
  AND b.deleted_at IS NULL
  AND s.download_disabled = 0
  AND s.deleted_at IS NULL
  AND s.active = 1
INTO OUTFILE '/var/lib/mysql-files/pool_maps.tsv'
  CHARACTER SET utf8mb4;

SELECT DISTINCT s.beatmapset_id,
       s.artist,
       s.artist_unicode,
       s.title,
       s.title_unicode,
       s.creator,
       NULLIF(s.bpm, 0),
       s.cover_updated_at,
       s.nsfw
FROM osu_beatmapsets s
JOIN osu_beatmaps b ON b.beatmapset_id = s.beatmapset_id
WHERE b.playmode = 0
  AND b.approved IN (1, 2)
  AND b.deleted_at IS NULL
  AND s.download_disabled = 0
  AND s.deleted_at IS NULL
  AND s.active = 1
INTO OUTFILE '/var/lib/mysql-files/pool_sets.tsv'
  CHARACTER SET utf8mb4;