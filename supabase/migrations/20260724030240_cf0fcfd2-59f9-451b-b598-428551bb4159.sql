
ALTER TABLE public.auge_tag_custom_scan ALTER COLUMN last_scanned_at DROP NOT NULL;
ALTER TABLE public.auge_tag_custom_scan ALTER COLUMN last_scanned_at DROP DEFAULT;

UPDATE public.auge_sync_runs
   SET status='error', finished_at=now(),
       error_message=COALESCE(error_message,'')||' [cancelado: descoberta travada]'
 WHERE entidade='tag_custom' AND status='running';

UPDATE public.auge_tag_custom_scan
   SET last_scanned_at=NULL, erro=NULL
 WHERE qtd_tags=0;
