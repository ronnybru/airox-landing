import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	images: {
		domains: [
			"res.cloudinary.com",
			"lh3.googleusercontent.com",
			"randomuser.me",
		],
	},
};

export default nextConfig;
