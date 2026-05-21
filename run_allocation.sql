DO $$
DECLARE
    r RECORD;
    next_pos_n04 INTEGER := 1;
    next_pos_n01 INTEGER := 13;
    current_pos INTEGER;
    conf_name TEXT;
BEGIN
    FOR r IN SELECT * FROM registros WHERE nf IN ('109265', '827') AND id NOT IN (SELECT registro_id FROM estoque_posicoes WHERE registro_id IS NOT NULL)
    LOOP
        -- Determine next position
        IF r.endereco = 'TEC01.D.N04' THEN
            current_pos := next_pos_n04;
            next_pos_n04 := next_pos_n04 + 1;
        ELSIF r.endereco = 'TEC01.D.N01' THEN
            current_pos := next_pos_n01;
            next_pos_n01 := next_pos_n01 + 1;
        ELSE
            CONTINUE;
        END IF;

        -- Get conferente name
        SELECT conferente INTO conf_name FROM conferences WHERE id = r.conference_id LIMIT 1;
        IF conf_name IS NULL THEN conf_name := 'Sistema'; END IF;

        -- Insert into estoque_posicoes
        INSERT INTO estoque_posicoes (
            estrutura, coluna, nivel, posicao, status, registro_id, item, proc, m2, largura, m_linear, lote, endereco, lote_sistema, conferente_entrada, data_registro
        ) VALUES (
            split_part(r.endereco, '.', 1),
            split_part(r.endereco, '.', 2),
            CAST(replace(split_part(r.endereco, '.', 3), 'N', '') AS INTEGER),
            current_pos,
            'ocupado',
            r.id,
            r.item,
            r.nf,
            r.m2,
            r.largura,
            r.m_linear,
            r.lote,
            r.endereco,
            r.lote_sistema,
            conf_name,
            r.created_at
        );

        -- Update registros
        UPDATE registros SET posicao = current_pos WHERE id = r.id;
    END LOOP;
END $$;
