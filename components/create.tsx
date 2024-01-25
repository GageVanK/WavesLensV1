import { useState } from "react";
import {
  ReferencePolicyType,
  useCreatePost,
  useSession,
} from "@lens-protocol/react-web";
import { useSDK } from "@thirdweb-dev/react";
import fileToMimeType from "@/lib/fileToMimeType";
import fileToContentFocus from "@/lib/fileToContentFocus";
import useUpload from "@/lib/useUpload";
import { useRouter } from "next/router";
import {
  Avatar,
  Paper,
  Text,
  Button,
  Textarea,
  Space,
  Group,
  Container,
  Checkbox,
  ActionIcon,
  FileInput,
  Center,
} from "@mantine/core";
import SignInWithLensButton from "@/components/SignInWithLensButton";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { BiTimer } from "react-icons/bi";
import { textOnly } from "@lens-protocol/metadata";

export function Create() {
  const router = useRouter();
  const sdk = useSDK();
  const upload = useUpload();

  // Form state
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState<string>("");
  const [isFollowersOnly, setIsFollowersOnly] = useState<boolean>(false);

  const { data: session } = useSession();

  const createUnencrypted = useCreatePost();

  async function handleCreatePost() {
    if (!sdk || session?.type !== "WITH_PROFILE") return;

    let result;

    try {
      const metadata = textOnly({ content: content });

      const uri = await upload(metadata);

      const result = await createUnencrypted.execute({
        metadata: uri,
      });

      console.log(result)
      if (result.isFailure()) {
        switch (result.error.name) {
          case 'BroadcastingError':
            console.log('There was an error broadcasting the transaction', result.error.message);
            break;

          case 'PendingSigningRequestError':
            console.log(
              'There is a pending signing request in your wallet. ' +
                'Approve it or discard it and try again.'
            );
            break;

          case 'WalletConnectionError':
            console.log('There was an error connecting to your wallet', result.error.message);
            break;

          case 'UserRejectedError':
            // the user decided to not sign, usually this is silently ignored by UIs
            break;
        }
        return;
      }

      // this might take a while, depends on the type of tx (on-chain or Momoka)
      // and the congestion of the network
      const completion = await result.value.waitForCompletion();

      if (completion.isFailure()) {
        notifications.show({
          title: "Error creating post.",
          icon: <IconX size="1.1rem" />,
          color: "red",
          message: `Something went wrong creating your post. ${completion.error.message}.`,
        });
        console.log(
          "There was an processing the transaction",
          completion.error.message,
        );
        return;
      }

      // the post is now ready to be used
      const post = completion.value;
      notifications.show({
        title: "Success",
        icon: <IconCheck size="1.1rem" />,
        color: "Green",
        message: "Your Post has been successfully indexed!",
      });
    } catch (error) {
      console.error(error);
      notifications.show({
        title: "Error creating post.",
        icon: <IconX size="1.1rem" />,
        color: "red",
        message:
          "Something went wrong creating your post. Please try again later.",
      });
    }
  }

  return (
    <>
      {session?.authenticated && session?.type === "WITH_PROFILE" && (
        <Container>
          <Group justify="left">
            <Avatar
              // @ts-ignore
              src={session?.profile?.metadata?.picture.optimized.uri || "https://gw.ipfs-lens.dev/ipfs/bafybeidkewnnnisaqmwk7ornt6fymjddlkhlou2tsfhaxxnird4w4yrebe"}
              size="lg"
              radius="xl"
            />

            <Text fw={500} size="lg">
              {session?.profile?.handle?.localName || "anon"}
            </Text>
          </Group>
          <Space h="md" />
          <Textarea
            id="content"
            variant="filled"
            size="md"
            radius="md"
            placeholder="Announce your next Stream!"
            onChange={(e) => setContent(e.target.value)}
            
          />

          <Space h="md" />

          <Group justify="left">
            <Button
              variant="gradient"
              gradient={{ from: "blue", to: "cyan", deg: 205 }}
              onClick={() => {
                handleCreatePost(); // Trigger the createpost function
              }}
            >
              Create
            </Button>
          </Group>
        </Container>
      )}
    </>
  );
}
