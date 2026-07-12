
GRANT EXECUTE ON FUNCTION public.is_sub_user_of(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_sub_user_owner(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_owner_id_for_sub_user(uuid) TO authenticated;
