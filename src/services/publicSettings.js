const API_URL = `${(process.env.NEXT_PUBLIC_API_BASE_URL || '').replace(/\/$/, '')}/api/v1`;

let publicSettingsRequest = null;

export const getPublicSettings = async () => {
    if (!publicSettingsRequest) {
        publicSettingsRequest = fetch(`${API_URL}/settings/public`)
            .then(async (res) => {
                if (!res.ok) {
                    throw new Error(`Public settings request failed with status ${res.status}`);
                }
                const result = await res.json();
                return result?.data?.settings || [];
            })
            .finally(() => {
                publicSettingsRequest = null;
            });
    }

    return publicSettingsRequest;
};
