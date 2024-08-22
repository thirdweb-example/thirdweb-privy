import { useRouter } from "next/router";
import { useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import Head from "next/head";
import { ConnectButton, PayEmbed, useConnect } from "thirdweb/react";
import { ethers5Adapter } from "thirdweb/adapters/ethers5";
import { defineChain } from "thirdweb";
import { smartWallet } from "thirdweb/wallets";
import { client } from "./_app";

export default function DashboardPage() {
	const router = useRouter();
	const { ready, authenticated, user, logout } = usePrivy();

	useEffect(() => {
		if (ready && !authenticated) {
			router.push("/");
		}
	}, [ready, authenticated, router]);

	const numAccounts = user?.linkedAccounts?.length || 0;

	const { wallets } = useWallets(); // from privy
	const { connect } = useConnect(); // from thirdweb

	useEffect(() => {
		connect(async () => {
			if (wallets.length > 0) {
				const privyWallet = wallets[0];
				if (privyWallet) {
					const ethersProvider = await privyWallet.getEthersProvider();
					// adapt privy wallet to a thirdweb account
					const adaptedAccount = await ethers5Adapter.signer.fromEthers({
						signer: ethersProvider.getSigner(),
					});
					const chain = defineChain(Number(privyWallet.chainId.split(":")[1]));
					// create the thirdweb smart wallet with the adapted account as the admin
					const smart = smartWallet({
						chain,
						sponsorGas: true,
					});

					smart.subscribe("disconnect", () => {
						logout();
					});

					await smart.connect({
						client,
						personalAccount: adaptedAccount,
					});

					return smart;
				}
			}
		});
	}, [wallets, connect, logout]);

	return (
		<>
			<Head>
				<title>Privy + thirdweb</title>
			</Head>

			<main className="flex flex-col min-h-screen px-4 sm:px-20 py-6 sm:py-10 bg-privy-light-blue">
				{ready && authenticated ? (
					<>
						<div className="flex flex-col">
							<h1 className="text-2xl font-semibold">Privy + thirdweb</h1>
							<div className="py-4">
								<ConnectButton client={client} />
							</div>
							<div className="py-4">
								<PayEmbed client={client} />
							</div>
						</div>
					</>
				) : null}
			</main>
		</>
	);
}
