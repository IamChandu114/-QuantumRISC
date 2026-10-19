`timescale 1ns / 1ps

//////////////////////////////////////////////////////////////////////////////////
// Project : QuantumRISC
// Module  : Immediate Generator
// Author  : Chandu Vemula
//
// Description:
// Generates immediate values for RISC-V instructions
//
// Supported:
// I-Type
// S-Type
// B-Type
// U-Type
// J-Type
//////////////////////////////////////////////////////////////////////////////////

module immediate_generator(

    input  logic [31:0] instruction,
    output logic [31:0] immediate

);


always @* begin

    case(instruction[6:0])


        //==================================================
        // I-Type
        // ADDI, LOAD, JALR
        //==================================================

        7'b0010011,
        7'b0000011,
        7'b1100111:

        begin

            immediate = {
                {20{instruction[31]}},
                instruction[31:20]
            };

        end



        //==================================================
        // S-Type
        // STORE
        //==================================================

        7'b0100011:

        begin

            immediate = {

                {20{instruction[31]}},
                instruction[31:25],
                instruction[11:7]

            };

        end



        //==================================================
        // B-Type
        // BRANCH
        //==================================================

        7'b1100011:

        begin

            immediate = {

                {19{instruction[31]}},
                instruction[31],
                instruction[7],
                instruction[30:25],
                instruction[11:8],
                1'b0

            };

        end



        //==================================================
        // U-Type
        // LUI / AUIPC
        //==================================================

        7'b0110111,
        7'b0010111:

        begin

            immediate = {

                instruction[31:12],
                12'b0

            };

        end



        //==================================================
        // J-Type
        // JAL
        //==================================================

        7'b1101111:

        begin

            immediate = {

                {11{instruction[31]}},
                instruction[31],
                instruction[19:12],
                instruction[20],
                instruction[30:21],
                1'b0

            };

        end



        default:

        begin

            immediate = 32'b0;

        end


    endcase


end


endmodule