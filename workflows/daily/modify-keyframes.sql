-- Modifica el texto del primer paso (index 0) directamente sin romper el resto del JSON
UPDATE historias_scrolly
SET json_modificado = jsonb_set(json_modificado, '{scenes,0,text}', '"Texto corregido a mano para Alice y Bob"')
WHERE slug = 'diffie-hellman-exchange';