import axios from "axios";

// function getToken() {
const token = async () => {
    try {
// Bagi yang mau beli source code auto generate tokennya bisa chat ke wa: https://wa.me/6285157729639
// karena API generate token ini sewaktu-waktu bisa dimatikan tanpa pemberitahuan sebelumnya.
    const res = await axios.get("https://dramabox-token.vercel.app/token");
    return res.data;
    } catch (error) {
    throw error;
}
}

export { token };
export default { token };
